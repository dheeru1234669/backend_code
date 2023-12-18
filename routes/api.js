const express = require("express");
const app = require("../config/setting");

var router = express.Router();

const {Launch, Login, Category, Item, Modifier, Tag, Extras_group, Table_management, Profile, Theme, Customer, Home, Customer_category, Cart, Waiter, Waiter_profile, Order, Waiter_table, Waiter_order, Dashboard, Dashboard_table_manage, Dashboard_orders, Dashboard_assembly} = require("../controllers");

const {checkAuth, formValidate} = require("../middleware");


router.get("/backend/launch", Launch.launchScreen);

router.post("/admin/login", Login.login);

router.post("/admin/cate-info",         Category.get_category);
router.post("/admin/category",          Category.add_category);
router.put("/admin/category-delete",    Category.delete_category);
router.put("/admin/category",           Category.add_category);

router.get("/admin/cat-and-item",       Item.cat_and_item);
router.get("/admin/all-item",           Item.all_item_info);
router.post("/admin/create-item",       Item.create_item);
router.post("/admin/item",              Item.get_item);
router.post("/admin/item-search",       Item.item_search);
router.post("/admin/isvalid-create-visibility", Item.isvalid_create_visibility);
router.post("/admin/isvalid-item-varient",      Item.isvalid_item_varient);
router.post("/admin/isvalid-price-variation",   Item.isvalid_price_variation);
router.get("/admin/fulfillment-station",        Item.list_fulfilment_station);


router.post("/admin/modifier-group",        Modifier.create_modifier_group);
router.get("/admin/modifier-group",         Modifier.list_modifier_group);
router.get("/admin/modifier-group-for-item",Modifier.list_modifier_group_filter);
router.post("/admin/modifier-group-detail", Modifier.modifier_group_detail);
router.post("/admin/modifier-group-search", Modifier.search_modifier_group);
router.post("/admin/modifier-group-delete", Modifier.delete_modifier_group);
router.post("/admin/update-modifier-group", Modifier.update_modifier_group_main);
router.post("/admin/add-modifier-option",   Modifier.add_modifier_option);

router.post("/admin/tag",                   Tag.create_tag);
router.put("/admin/tag",                    Tag.update_tag);
router.get("/admin/tag",                    checkAuth,Tag.list_tag);
router.post("/admin/tag-search",            checkAuth,Tag.search_tag);

router.get("/admin/prefernce-tag",          Tag.list_pref_tag);
router.put("/admin/prefernce-tag",          Tag.update_pref_tag);

router.post("/admin/extras-group",          Extras_group.create_extras_group);
router.post("/admin/extras-group-by-id",    Extras_group.extras_group_by_id);
router.get("/admin/extras-group",           Extras_group.list_extras_group);
router.put("/admin/extras-group",           Extras_group.delete_extras_group);
router.post("/admin/extras-group-search",   Extras_group.search_extras_group);
router.post("/admin/remove-options",        Extras_group.remove_option);

router.get("/admin/table-overview",         Table_management.overview);
router.get("/admin/zone",                   Table_management.list_zone);
router.post("/admin/zone",                  Table_management.create_zone);
router.put("/admin/zone",                   Table_management.delete_zone);
router.post("/admin/table",                 Table_management.create_table);
router.put("/admin/table",                  Table_management.delete_table);
router.get("/admin/table",                  Table_management.list_table);
router.post("/admin/qrcode",                Table_management.qrcode_generator);

router.post("/admin/location",              Profile.create_loc);
router.get("/admin/location",               Profile.list_location);
router.get("/admin/profile-overview",       Profile.profile_overview);
router.post("/admin/profile-user",          Profile.create_user);
router.get("/admin/profile-user",           Profile.list_user);
router.post("/admin/user-info",             Profile.user_info);
router.post("/admin/fulfilment-station",    Profile.create_fulfilment_station);
router.put("/admin/fulfilment-station",     Profile.update_fulfilment_station);
router.get("/admin/fulfilment-station",     Profile.list_fulfilment_station);
router.get("/admin/admin-section",          Profile.admin_section);
router.get("/admin/pages",                  Profile.pages);

router.get("/admin/theme-color",            Theme.list_theme_color);
router.post("/admin/theme-color",           Theme.theme_color);
router.get("/admin/theme-msg",              Theme.get_theme_msgs);
router.post("/admin/theme-msg",             Theme.insert_theme_msg);

router.post("/admin/imageupload",           Category.image_upload);


router.post("/customer/login",              Customer.login);

router.post("/customer/home-screen",        Home.home_screen);
router.get("/customer/theme",               Home.theme);

router.post("/customer/category-list",      Customer_category.list_category);
router.post("/customer/items",              Customer_category.items_by_cat);
router.post("/customer/item-info",          Customer_category.item_dtl_by_id);

router.post("/customer/save-in-cart",       checkAuth, Cart.save_in_cart);
router.post("/customer/cart-count",          checkAuth, Cart.cart_count);
router.get("/customer/cart-detail",         checkAuth, Cart.cart_detail);
router.post("/customer/cart-update-qty",    checkAuth, Cart.cart_update_qty);

router.post("/customer/order-save",         checkAuth, Order.save_order);
router.get("/customer/order-history",       checkAuth, Order.order_history);

router.get("/customer/preference-tag",      Tag.list_pref_tag_for_customer);
router.post("/customer/calling-waiter",      checkAuth, Order.calling_waiter);


router.post("/waiter/login",                Waiter.login);
router.get("/waiter/profile",               checkAuth, Waiter_profile.profile);
router.get("/waiter/preference-tag",        Tag.list_pref_tag);
router.get("/waiter/table",                 Waiter_table.tables);
router.get("/waiter/table-status",          Table_management.table_status_name);
router.put("/waiter/table-status",          Waiter_table.update_table_status);
router.get("/waiter/zone",                  Table_management.list_zone);
router.get("/waiter/orders",                checkAuth, Waiter_order.list_orders);
router.post("/waiter/order-detail",         checkAuth, Waiter_order.order_detail);
router.post("/waiter/consolidated-order-detail", checkAuth, Waiter_order.order_detail_tbl_wise);
router.get("/waiter/order-history",         checkAuth, Order.order_history_waiter);
router.post("/waiter/order-cancel",         checkAuth, Waiter_order.order_cancel);
router.post("/waiter/order-update-qty",     checkAuth, Waiter_order.order_update_qty);
router.post("/waiter/item-info",            Customer_category.item_dtl_by_id);
router.post("/waiter/category-list",        Customer_category.list_category);
router.post("/waiter/home-screen",          Home.home_screen);
router.get("/waiter/new-notification",      checkAuth, Order.notification_check);
router.get("/waiter/notification",          checkAuth, Order.notifications);
router.put("/waiter/notification",          checkAuth, Order.notification_update);
router.put("/waiter/notification-all",      checkAuth, Order.notification_all_update);
router.post("/waiter/items",                Customer_category.items_by_cat);
router.post("/waiter/save-in-cart",         checkAuth, Cart.save_in_cart);
router.post("/waiter/cart-count",           checkAuth, Cart.cart_count);
router.get("/waiter/cart-detail",           checkAuth, Cart.cart_detail_by_waiter);
router.post("/waiter/cart-update-qty",      checkAuth, Cart.cart_update_qty_by_waiter);
router.post("/waiter/order-save",           checkAuth, Order.save_order_by_waiter);
router.post("/waiter/order-edit",           checkAuth, Order.edit_order_by_waiter);
router.post("/waiter/order-status",         checkAuth, Waiter_order.update_order_status);

router.get("/dashboard/passcode-with-panel",    Dashboard.passcode_with_panel);
router.post("/dashboard/passcode",              Dashboard.passcode);
router.get("/dashboard/dashboard-table-assign", checkAuth, Dashboard_table_manage.table_assign);
router.post("/dashboard/waiter-table-assign",   checkAuth, Dashboard_table_manage.waiter_table_assign)
router.post("/dashboard/waiter-table-re-assign",checkAuth, Dashboard_table_manage.waiter_table_re_assign)
router.post("/dashboard/assign-all-reset",      checkAuth, Dashboard_table_manage.assign_all_reset)

router.get("/dashboard/waiter-schedule",        Dashboard.waiter_schedule);
router.post("/dashboard/waiter-schedule-update",Dashboard.waiter_schedule_update);
router.get("/dashboard/table-status",           Table_management.table_status_name);
router.put("/dashboard/table-status",           Waiter_table.update_table_status);

router.get("/dashboard-table-manage/tables",        checkAuth,Dashboard_table_manage.table_list);
router.put("/dashboard-table-manage/table-status",  checkAuth,Dashboard_table_manage.update_table_status);

router.get("/dashboard-overview/tables",            checkAuth,Dashboard_table_manage.table_list);

router.post("/dashboard-orders/orders",             checkAuth,Dashboard_orders.orders_fulfillment_wise);
router.put("/dashboard-orders/order-status",        checkAuth,Dashboard_orders.order_status_update);
router.post("/dashboard-assembly/orders",            checkAuth,Dashboard_assembly.orders);
router.post("/dashboard-assembly/order-to-assembled",checkAuth,Dashboard_assembly.order_to_assembled);
router.put("/dashboard-assembly/order-status",      checkAuth,Order.update_order_status);


module.exports = router;
