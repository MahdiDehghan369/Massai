const { isValidObjectId } = require("mongoose");
const CategoryModel = require("./../models/categoryModel");
const productModel = require("./../models/productModel");
const getCategoryWithChildren = require("./../utils/getCategoryWithChildren");

exports.createCategory = async (req, res, next) => {
  try {
    let { title, slug, description, type, parent = null } = req.body;

    slug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    type = type.toLowerCase();

    if (parent) {
      if (!isValidObjectId(parent)) {
        return res.status(422).json({
          success: false,
          message: "Parent category ID is not valid ❌",
        });
      }

      const parentCategory = await CategoryModel.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found ❌",
        });
      }

      if (parentCategory.type !== type) {
        return res.status(400).json({
          success: false,
          message:
            "Parent category type must be the same as the new category type ❌",
        });
      }
    }

    const isCategoryExistsWithSlug = await CategoryModel.findOne({
      type,
      slug,
    });

    if (isCategoryExistsWithSlug) {
      return res.status(400).json({
        success: false,
        message: "Category with this slug already exists",
      });
    }

    const category = await CategoryModel.create({
      title,
      slug,
      description,
      type,
      parent,
    });

    return res.status(200).json({
      success: true,
      message: "Category created successfully ✅",
      category,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(422).json({
        success: false,
        message: "Category ID is not valid ❌",
      });
    }

    const category = await CategoryModel.findOne({ _id: id });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found ❌",
      });
    }

    let { title, slug, description, type, parent = null } = req.body;

    slug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    type = type.toLowerCase();

    if (parent) {
      if (!isValidObjectId(parent)) {
        return res.status(422).json({
          success: false,
          message: "Parent category ID is not valid ❌",
        });
      }

      const parentCategory = await CategoryModel.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found ❌",
        });
      }
      if (parentCategory.type !== type) {
        return res.status(400).json({
          success: false,
          message:
            "Parent category type must be the same as the new category type ❌",
        });
      }
    }

    const isCategoryExistsWithSlug = await CategoryModel.findOne({
      slug,
      type,
      _id: { $ne: id },
    });

    if (isCategoryExistsWithSlug) {
      return res.status(400).json({
        success: false,
        message: "Category with this slug already exists",
      });
    }

    category.title = title;
    category.slug = slug;
    category.description = description;
    category.type = type;
    category.parent = parent;

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully ✅",
      category,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(422).json({
        success: false,
        message: "Category ID is not valid ❌",
      });
    }

    const category = await CategoryModel.findOneAndDelete({ _id: id });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found ❌",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category removed successfully ❌",
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryInfo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(422).json({
        success: false,
        message: "Category ID is not valid ❌",
      });
    }

    const categoryTree = await getCategoryWithChildren(id);

    if (!categoryTree) {
      return res.status(404).json({
        success: false,
        message: "Category not found ❌",
      });
    }

    return res.status(200).json({
      success: true,
      category: categoryTree,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllCategory = async (req, res, next) => {
  try {
    const { type } = req.query;

    let query = {
      parent: null,
    };

    if (type) {
      query.type = type;
    }

    const rootCategories = await CategoryModel.find({ ...query }).lean();

    const categoriesWithChildren = await Promise.all(
      rootCategories.map((cat) => getCategoryWithChildren(cat._id))
    );

    return res.status(200).json({
      success: true,
      categories: categoriesWithChildren,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductsOfCategory = async (req, res, next) => {
  try {
    const catId = req.params.id;
    const { page = 1, limit = 10 } = req.query;

    const category = await CategoryModel.findById(catId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const getAllSubCategoryIds = async (parentId) => {
      const subs = await CategoryModel.find({ parent: parentId }, { _id: 1 });
      let ids = subs.map((s) => s._id);
      for (const sub of subs) {
        const children = await getAllSubCategoryIds(sub._id);
        ids = ids.concat(children);
      }
      return ids;
    };

    const subCategoryIds = await getAllSubCategoryIds(category._id);

    const allCategoryIds = [category._id, ...subCategoryIds];

    const products = await productModel
      .find({ category: { $in: allCategoryIds }, statusProduct: "published" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await productModel.countDocuments({
      category: { $in: allCategoryIds },
    });

    return res.status(200).json({
      success: true,
      message: "Get successfully",
      products,
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};
