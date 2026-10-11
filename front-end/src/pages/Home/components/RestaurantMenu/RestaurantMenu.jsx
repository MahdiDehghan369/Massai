import RestaurantMenuItem from "./RestaurantMenuItem"
import SectionTitle from "../../../../components/Ui/SectionTitle"
const RestaurantMenu = () => {
    return(
        <section className="mt-10">
            <SectionTitle>منوی رستوران</SectionTitle>
            <div className="container flex mt-5 flex-wrap justify-between">
                <RestaurantMenuItem src="/images/RestaurantMenu/image.png">دسر</RestaurantMenuItem>
                <RestaurantMenuItem src="/images/RestaurantMenu/image-3.png">ایرانی</RestaurantMenuItem>
                <RestaurantMenuItem src="/images/RestaurantMenu/image-1.png">فست فود</RestaurantMenuItem>
                <RestaurantMenuItem src="/images/RestaurantMenu/image-2.png" >نوشیدنی</RestaurantMenuItem>
            </div>
        </section>
    )
}

export default RestaurantMenu
