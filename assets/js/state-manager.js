/* ============================================================
   YNHI OS — STATE MANAGER
   Tầng State trung tâm - nơi DUY NHẤT toàn bộ UI đọc dữ liệu Order.
   File này KHÔNG được chứa:
   - querySelector / querySelectorAll
   - innerHTML / outerHTML
   - onclick
   - addEventListener
   Đây là State Layer thuần dữ liệu. UI đọc State, không sở hữu State.
   Phụ thuộc: order-model.js, storage.js (nạp trước file này).
   ------------------------------------------------------------
   NÂNG CẤP: hỗ trợ NHIỀU Draft cùng lúc (drafts[]) thay vì 1
   draftOrder duy nhất. Toàn bộ API công khai mà UI đang gọi
   (getDraft, updateDraft, saveDraft, addProduct, removeProduct,
   updateProductQty, clearDraftState, initState) GIỮ NGUYÊN tên
   và cách gọi - chỉ đổi cách lưu trữ bên trong, luôn thao tác
   trên "Draft đang active" (activeDraftId).
   ============================================================ */

var AppState = {
  orders: [],
  drafts: [],
  activeDraftId: null,
  selectedOrderId: null,
  ui: {
    selectedTab: "today"
  }
};

/**
 * Tìm vị trí (index) của 1 Draft trong AppState.drafts theo id.
 * Helper nội bộ, không phải API công khai.
 * @param {string} draftId
 * @returns {number}
 */
function findDraftIndexById(draftId) {
  for (var i = 0; i < AppState.drafts.length; i++) {
    if (AppState.drafts[i].id === draftId) {
      return i;
    }
  }
  return -1;
}

/**
 * Tạo một Draft rỗng mới, thêm vào danh sách drafts[], đặt làm Draft
 * đang active, rồi lưu xuống storage.
 * Đây là NƠI DUY NHẤT một Draft được tạo ra (đúng Draft Lifecycle
 * Specification #1: Draft chỉ được tạo khi Create Order Menu → Tạo đơn mới).
 * @returns {object} Draft vừa được tạo
 */
function createNewDraft() {
  var freshDraft = createEmptyDraftOrder();
  freshDraft.id = generateOrderId();

  AppState.drafts.push(freshDraft);
  AppState.activeDraftId = freshDraft.id;

  saveDrafts(AppState.drafts);
  saveActiveDraftId(AppState.activeDraftId);

  return freshDraft;
}

/**
 * Đặt một Draft đã tồn tại (theo id) làm Draft đang active.
 * Dùng khi Draft List cho phép mở tiếp một Draft cụ thể trên New Order.
 * Không tạo Draft mới - nếu id không tồn tại trong drafts[], không đổi gì.
 * @param {string} draftId
 * @returns {object|null} Draft vừa được đặt làm active, hoặc null nếu không tìm thấy
 */
function setActiveDraft(draftId) {
  var index = findDraftIndexById(draftId);
  if (index === -1) {
    return null;
  }

  AppState.activeDraftId = draftId;
  saveActiveDraftId(AppState.activeDraftId);

  return AppState.drafts[index];
}

/**
 * Khởi tạo AppState từ dữ liệu đã lưu (localStorage).
 * Gọi một lần khi một trang cần dùng đến State.
 * LƯU Ý: initState() KHÔNG tự tạo Draft mới - Draft chỉ được tạo
 * qua createNewDraft() (đúng Draft Lifecycle Specification #1).
 * @returns {object} AppState
 */
function initState() {
  AppState.orders = loadOrders();
  AppState.drafts = loadDrafts();
  AppState.activeDraftId = loadActiveDraftId();
  AppState.selectedOrderId = loadSelectedOrder();
  AppState.ui = {
    selectedTab: "today"
  };

  return AppState;
}

/**
 * Lấy toàn bộ danh sách Order hiện có trong State.
 * @returns {object[]}
 */
function getOrders() {
  return AppState.orders;
}

/**
 * Lấy một Order theo id.
 * @param {string} id
 * @returns {object|null}
 */
function getOrderById(id) {
  if (!id) {
    return null;
  }
  var found = AppState.orders.filter(function (order) {
    return order.id === id;
  });
  return found.length > 0 ? found[0] : null;
}

/**
 * Đặt Order đang được chọn (ví dụ khi bấm vào 1 card đơn để mở Order Detail).
 * Đồng bộ vào storage để trang khác (order-detail.html) đọc được.
 * @param {string} id
 */
function setSelectedOrder(id) {
  AppState.selectedOrderId = id;
  saveSelectedOrder(id);
}

/**
 * Lấy Order đang được chọn hiện tại.
 * @returns {object|null}
 */
function getSelectedOrder() {
  return getOrderById(AppState.selectedOrderId);
}

/**
 * Lấy Draft ĐANG ACTIVE hiện tại (đơn đang tạo dở trên New Order).
 * Đây vẫn là API "1 Draft" mà New Order đang dùng - phía sau nó
 * giờ đọc từ danh sách drafts[] theo activeDraftId.
 * @returns {object}
 */
function getDraft() {
  var index = findDraftIndexById(AppState.activeDraftId);
  return index !== -1 ? AppState.drafts[index] : null;
}

/**
 * Lấy 1 Draft bất kỳ theo id (không nhất thiết là Draft đang active).
 * @param {string} draftId
 * @returns {object|null}
 */
function getDraftById(draftId) {
  var index = findDraftIndexById(draftId);
  return index !== -1 ? AppState.drafts[index] : null;
}

/**
 * Lấy toàn bộ danh sách Draft hiện có (Draft A, Draft B, Draft C...).
 * @returns {object[]}
 */
function getAllDrafts() {
  return AppState.drafts;
}

/**
 * Cập nhật một field trong Draft ĐANG ACTIVE theo đường dẫn dạng chuỗi.
 * Ví dụ: updateDraft("customer.name", "Chị Hồng Nhung")
 *        updateDraft("delivery.shipFee", 25000)
 * @param {string} path
 * @param {*} value
 */
function updateDraft(path, value) {
  if (!path) {
    return;
  }
  var draft = getDraft();
  if (!draft) {
    return;
  }

  var keys = path.split(".");
  var target = draft;

  for (var i = 0; i < keys.length - 1; i++) {
    var key = keys[i];
    if (target[key] === undefined || target[key] === null || typeof target[key] !== "object") {
      target[key] = {};
    }
    target = target[key];
  }

  target[keys[keys.length - 1]] = value;

  try {
    draft.summary = recalculateSummary(draft);
  } catch (error) {
    // Không để lỗi tính summary chặn việc lưu Draft xuống storage.
  }

  saveDrafts(AppState.drafts);
}

/**
 * Lưu (upsert) một Draft vào danh sách drafts[] theo đúng id của nó.
 * Đây là API công khai mà UI (Popup "Lưu đơn nháp") đang gọi:
 * saveDraft(getDraft())
 * @param {object} draft
 */
function saveDraft(draft) {
  if (!draft || !draft.id) {
    return;
  }

  var index = findDraftIndexById(draft.id);
  if (index !== -1) {
    AppState.drafts[index] = draft;
  } else {
    AppState.drafts.push(draft);
  }

  saveDrafts(AppState.drafts);
}

/**
 * Xóa 1 Draft khỏi danh sách theo id.
 * Nếu Draft bị xóa chính là Draft đang active, activeDraftId sẽ
 * được reset về null (lần initState() kế tiếp sẽ tự tạo Draft mới).
 * @param {string} draftId
 */
function deleteDraft(draftId) {
  AppState.drafts = AppState.drafts.filter(function (draft) {
    return draft.id !== draftId;
  });
  saveDrafts(AppState.drafts);

  if (AppState.activeDraftId === draftId) {
    AppState.activeDraftId = null;
    saveActiveDraftId(null);
  }
}

/**
 * Xóa Draft ĐANG ACTIVE hiện tại (dùng cho nút "Hủy đơn nháp").
 * Giữ nguyên tên hàm cũ để không phải sửa Popup/New Order.
 */
function clearDraftState() {
  if (AppState.activeDraftId) {
    deleteDraft(AppState.activeDraftId);
  }
}

/**
 * Thêm 1 sản phẩm vào Draft ĐANG ACTIVE.
 * Nếu sản phẩm (theo id) đã tồn tại trong giỏ, tăng qty thay vì tạo dòng mới.
 * @param {object} product - { id, name, price, category }
 */
function addProduct(product) {
  if (!product || !product.id) {
    return;
  }
  var draft = getDraft();
  if (!draft) {
    return;
  }
  if (!draft.products) {
    draft.products = [];
  }

  var existing = draft.products.filter(function (p) {
    return p.id === product.id;
  })[0];

  if (existing) {
    existing.qty = (Number(existing.qty) || 0) + 1;
  } else {
    draft.products.push({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      qty: 1,
      category: product.category || "cake"
    });
  }

  try {
    draft.summary = recalculateSummary(draft);
  } catch (error) {}
  saveDrafts(AppState.drafts);
}

/**
 * Xóa 1 sản phẩm khỏi Draft ĐANG ACTIVE theo id.
 * @param {string} productId
 */
function removeProduct(productId) {
  var draft = getDraft();
  if (!draft || !draft.products) {
    return;
  }
  draft.products = draft.products.filter(function (p) {
    return p.id !== productId;
  });

  try {
    draft.summary = recalculateSummary(draft);
  } catch (error) {}
  saveDrafts(AppState.drafts);
}

/**
 * Cập nhật số lượng của 1 sản phẩm trong Draft ĐANG ACTIVE.
 * Nếu qty <= 0, tự động xóa sản phẩm khỏi giỏ.
 * @param {string} productId
 * @param {number} qty
 */
function updateProductQty(productId, qty) {
  var draft = getDraft();
  if (!draft || !draft.products) {
    return;
  }

  if (qty <= 0) {
    removeProduct(productId);
    return;
  }

  var product = draft.products.filter(function (p) {
    return p.id === productId;
  })[0];

  if (product) {
    product.qty = qty;
  }

  try {
    draft.summary = recalculateSummary(draft);
  } catch (error) {}
  saveDrafts(AppState.drafts);
}

/**
 * Lấy danh sách sản phẩm hiện tại trong Draft ĐANG ACTIVE.
 * @returns {object[]}
 */
function getProducts() {
  var draft = getDraft();
  return (draft && draft.products) || [];
}

/**
 * Tạo một Order chính thức từ Draft ĐANG ACTIVE, thêm vào danh sách
 * orders, lưu lại storage, rồi XÓA Draft đó khỏi drafts[]
 * (Draft -> Order -> Draft bị xóa, đúng workflow nghiệp vụ Ynhi OS).
 * @returns {object|null} Order vừa được tạo
 */
function createOrder() {
  var draft = getDraft();
  if (!draft) {
    return null;
  }

  var draftId = draft.id;
  var sequenceNumber = AppState.orders.length + 1;
  var newOrder = createOrderFromDraft(draft, sequenceNumber);

  AppState.orders.push(newOrder);
  saveOrders(AppState.orders);

  deleteDraft(draftId);

  return newOrder;
}

/**
 * Cập nhật trạng thái của một Order theo id.
 * Đây là cách DUY NHẤT hợp lệ để chuyển trạng thái đơn -
 * tuyệt đối không giả lập trạng thái bằng cách sửa HTML.
 * @param {string} id
 * @param {string} status - một giá trị trong ORDER_STATUS
 * @returns {object|null} Order sau khi cập nhật
 */
function updateOrderStatus(id, status) {
  var order = getOrderById(id);
  if (!order) {
    return null;
  }
  order.status = status;
  order.updatedAt = new Date().toISOString();
  saveOrders(AppState.orders);
  return order;
}

/**
 * Lưu toàn bộ AppState hiện tại xuống storage.
 * Dùng khi cần chốt state trước khi rời trang.
 */
function saveState() {
  saveOrders(AppState.orders);
  saveDrafts(AppState.drafts);
  saveActiveDraftId(AppState.activeDraftId);
  saveSelectedOrder(AppState.selectedOrderId);
}

/**
 * Nạp lại AppState từ storage (đồng nghĩa initState, giữ để rõ ngữ nghĩa
 * khi gọi lại state sau khi một trang khác đã thay đổi dữ liệu).
 * @returns {object} AppState
 */
function loadState() {
  return initState();
}
