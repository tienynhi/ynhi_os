/* ============================================================
   YNHI OS
   PRODUCT CATALOG SERVICE

   Chỉ chịu trách nhiệm quản lý danh mục sản phẩm.

   Không được thao tác Draft.
   Không được thao tác Order.
   Không được thao tác Storage.
   ============================================================ */

var PRODUCTS = [

  {
    id: "cake-001",
    sku: "CAKE-001",
    name: "Bánh kem dâu tây size 20cm",
    price: 185000,
    category: "cake",
    active: true
  },

  {
    id: "cake-002",
    sku: "CAKE-002",
    name: "Bánh su kem hộp 6 cái",
    price: 65000,
    category: "cake",
    active: true
  },

  {
    id: "cake-003",
    sku: "CAKE-003",
    name: "Bánh mousse chanh dây mini",
    price: 45000,
    category: "cake",
    active: true
  },

  {
    id: "cake-004",
    sku: "CAKE-004",
    name: "Bánh red velvet size 18cm",
    price: 210000,
    category: "cake",
    active: true
  },

  {
    id: "acc-001",
    sku: "ACC-001",
    name: "Nến",
    price: 10000,
    category: "accessory",
    active: true
  },

  {
    id: "acc-002",
    sku: "ACC-002",
    name: "Mũ sinh nhật",
    price: 15000,
    category: "accessory",
    active: true
  },

  {
    id: "acc-003",
    sku: "ACC-003",
    name: "Thiệp",
    price: 5000,
    category: "accessory",
    active: true
  },

  {
    id: "acc-004",
    sku: "ACC-004",
    name: "Dao",
    price: 3000,
    category: "accessory",
    active: true
  },

  {
    id: "acc-005",
    sku: "ACC-005",
    name: "Muỗng",
    price: 2000,
    category: "accessory",
    active: true
  },

  {
    id: "acc-006",
    sku: "ACC-006",
    name: "Dĩa",
    price: 2000,
    category: "accessory",
    active: true
  },

  {
    id: "acc-007",
    sku: "ACC-007",
    name: "Khăn giấy",
    price: 1000,
    category: "accessory",
    active: true
  }

];

function getAllProducts() {
  return PRODUCTS.filter(function (product) {
    return product.active;
  });
}

function getProductById(productId) {
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id === productId) {
      return PRODUCTS[i];
    }
  }

  return null;
}