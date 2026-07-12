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
   ============================================================ */

var AppState = {
  orders: [],
  draftOrder: {},
  selectedOrderId: null,
  ui: {
    selectedTab: "today"
  }
};

/**
 * Khởi tạo AppState từ dữ liệu đã lưu (localStorage).
 * Gọi một lần khi một trang cần dùng đến State.
 * @returns {object} AppState
 */
function initState() {
  AppState.orders = loadOrders();
  AppState.draftOrder = loadDraft() || createEmptyDraftOrder();
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
 * Lấy Draft Order hiện tại (đơn đang tạo dở trên New Order).
 * @returns {object}
 */
function getDraft() {
  return AppState.draftOrder;
}

/**
 * Cập nhật một field trong Draft Order theo đường dẫn dạng chuỗi.
 * Ví dụ: updateDraft("customer.name", "Chị Hồng Nhung")
 *        updateDraft("delivery.shipFee", 25000)
 * @param {string} path
 * @param {*} value
 */
function updateDraft(path, value) {
  if (!path) {
    return;
  }
  var keys = path.split(".");
  var target = AppState.draftOrder;

  for (var i = 0; i < keys.length - 1; i++) {
    var key = keys[i];
    if (target[key] === undefined || target[key] === null || typeof target[key] !== "object") {
      target[key] = {};
    }
    target = target[key];
  }

  target[keys[keys.length - 1]] = value;

  try {
    AppState.draftOrder.summary = recalculateSummary(AppState.draftOrder);
  } catch (error) {
    // Không để lỗi tính summary chặn việc lưu Draft xuống storage.
  }

  saveDraft(AppState.draftOrder);
}
/**
 * Xóa Draft Order hiện tại, trả AppState.draftOrder về rỗng.
 */
function clearDraftState() {
  AppState.draftOrder = createEmptyDraftOrder();
  clearDraft();
}

/**
 * Tạo một Order chính thức từ Draft Order hiện tại, thêm vào danh sách
 * orders, lưu lại storage, rồi reset Draft Order về rỗng.
 * @returns {object} Order vừa được tạo
 */
function createOrder() {
  var sequenceNumber = AppState.orders.length + 1;
  var newOrder = createOrderFromDraft(AppState.draftOrder, sequenceNumber);

  AppState.orders.push(newOrder);
  saveOrders(AppState.orders);

  clearDraftState();

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
  saveDraft(AppState.draftOrder);
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
