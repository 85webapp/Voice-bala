import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Truck,
  MapPin,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { OrderItem } from '../types';

interface DashboardViewProps {
  orders: OrderItem[];
  onUpdateOrder?: (updated: OrderItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ orders, onUpdateOrder }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fromMonth, setFromDate] = useState('');
  const [toMonth, setToDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // Physical Courier Modal State
  const [orderForPhysical, setOrderForPhysical] = useState<OrderItem | null>(null);
  const [courierAddress, setCourierAddress] = useState('');
  const [courierPincode, setCourierPincode] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [courierEmail, setCourierEmail] = useState('');
  const [courierSuccessMsg, setCourierSuccessMsg] = useState(false);

  // Compute Total Spend and Total Refund
  const totalSpend = useMemo(() => {
    return orders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.totalFee, 0);
  }, [orders]);

  const totalRefund = useMemo(() => {
    return orders
      .filter((o) => o.status === 'Declined' && o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.totalFee, 0);
  }, [orders]);

  // Filter orders by search query and date range
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          order.docTitle.toLowerCase().includes(q) ||
          order.orderId.toLowerCase().includes(q) ||
          order.status.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      if (fromMonth && order.date < fromMonth) {
        return false;
      }
      if (toMonth && order.date > toMonth) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, fromMonth, toMonth]);

  const getStatusBadgeClass = (status: OrderItem['status']) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Processing':
      case 'Pending Process':
      case 'In Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Declined':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const handleOpenPhysicalModal = (order: OrderItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOrderForPhysical(order);
    setCourierAddress(order.shippingAddress || '');
    setCourierPincode(order.pincode || '');
    setCourierPhone(order.applicantPhone || '');
    setCourierEmail('');
    setCourierSuccessMsg(false);
  };

  const handleConfirmPhysicalDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForPhysical) return;

    if (!courierAddress.trim() || !courierPincode.trim() || !courierPhone.trim()) {
      alert('Please fill full delivery address, pincode, and contact number.');
      return;
    }

    const updated: OrderItem = {
      ...orderForPhysical,
      isPhysicalCourier: true,
      shippingAddress: courierAddress,
      pincode: courierPincode,
      shippingPhone: courierPhone,
      shippingStatus: 'Pending Dispatch',
      deliveryFee: (orderForPhysical.deliveryFee || 0) + 50,
      totalFee: orderForPhysical.totalFee + 50
    };

    if (onUpdateOrder) {
      onUpdateOrder(updated);
    }

    // Also update selected order if open
    if (selectedOrder && selectedOrder.orderId === updated.orderId) {
      setSelectedOrder(updated);
    }

    setCourierSuccessMsg(true);
    setTimeout(() => {
      setCourierSuccessMsg(false);
      setOrderForPhysical(null);
    }, 1800);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 animate-fadeIn pb-24">
      {/* Top Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-black">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track all your agreements, affidavits, and transactions
        </p>
      </div>

      {/* Top Spend and Refund Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        {/* Total Spend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Spend
          </span>
          <div className="text-2xl sm:text-3xl font-black text-black mt-1">
            ₹{totalSpend.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {orders.length} agreements
          </span>
        </div>

        {/* Total Refund */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Refund
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            ₹{totalRefund.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            100% processed to source
          </span>
        </div>
      </div>

      {/* Search Bar + Date Range Selectors */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by agreement name or docket ID..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Date Filter: To and From */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Filter by Date:</span>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="flex items-center gap-1 flex-1">
              <span className="text-slate-400 text-[11px]">From:</span>
              <input
                type="date"
                value={fromMonth}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 flex-1">
              <span className="text-slate-400 text-[11px]">To:</span>
              <input
                type="date"
                value={toMonth}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {(fromMonth || toMonth) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="text-[11px] font-bold text-blue-600 hover:underline px-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            All Records ({filteredOrders.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Click to view status &amp; timeline
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No records found</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust date filters or create an agreement from the Home tab.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.orderId}
              onClick={() => setSelectedOrder(order)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedOrder(order);
                }
              }}
              className="group bg-white hover:bg-blue-50/40 active:bg-blue-100/40 border border-slate-200/90 hover:border-blue-300 rounded-xl px-4 py-3.5 shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
            >
              {/* Document Name and Date */}
              <div className="min-w-0 pr-3">
                <h3 className="text-sm sm:text-base font-semibold text-black group-hover:text-blue-700 transition-colors truncate">
                  {order.docTitle}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{order.date}</span>
                  <span>&bull;</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {order.orderId}
                  </span>
                  <span>&bull;</span>
                  <span className="text-slate-600 font-medium">₹{order.totalFee}</span>
                </div>
              </div>

              {/* Status & Physical Order Option on Right */}
              <div className="flex items-center gap-2.5 shrink-0">
                {order.isPhysicalCourier ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Speed Post</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleOpenPhysicalModal(order, e)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-300 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Order Physically</span>
                  </button>
                )}

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal for Selected Order */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">
                  {selectedOrder.orderId}
                </span>
                <h3 className="text-base font-black text-black mt-0.5">
                  Request Docket Overview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
                <div className="text-slate-500">Document Requested:</div>
                <div className="text-sm font-bold text-black">
                  {selectedOrder.docTitle}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Date of submission: <strong>{selectedOrder.date}</strong> at{' '}
                  <strong>{selectedOrder.createdAt}</strong>
                </div>
              </div>

              {/* Status and Payment Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <span className="text-slate-400 block text-[11px]">Processing Status</span>
                  <span
                    className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <span className="text-slate-400 block text-[11px]">Payment Status</span>
                  <span
                    className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded border ${
                      selectedOrder.paymentStatus === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedOrder.paymentStatus === 'Cancelled'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Physical Dispatch Card */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Physical Dispatch:</span>
                  </div>
                  {selectedOrder.isPhysicalCourier ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Booked (Speed Post)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenPhysicalModal(selectedOrder)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Order Physically (+₹50)
                    </button>
                  )}
                </div>

                {selectedOrder.isPhysicalCourier && selectedOrder.shippingAddress && (
                  <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-200 pt-1.5">
                    <span className="font-semibold text-slate-700">Delivery Address: </span>
                    {selectedOrder.shippingAddress} (PIN: {selectedOrder.pincode})
                  </div>
                )}
              </div>

              {/* Pending duration message if pending */}
              {selectedOrder.status === 'Processing' || selectedOrder.status === 'Pending Process' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Pending in Queue:</strong>
                    <p className="mt-0.5">
                      This request has been pending for{' '}
                      <strong>{selectedOrder.pendingHours || 3} hours</strong> in attorney review. Target delivery within{' '}
                      {selectedOrder.deliveryHours} hours.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Charges Summary */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Standard Drafting &amp; e-Stamp:</span>
                  <span>₹{selectedOrder.baseFee}</span>
                </div>
                {selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Physical Dispatch / Expedited Fee:</span>
                    <span>+₹{selectedOrder.deliveryFee}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-sm text-black">
                  <span>Total Amount:</span>
                  <span>₹{selectedOrder.totalFee}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              {!selectedOrder.isPhysicalCourier ? (
                <button
                  type="button"
                  onClick={() => handleOpenPhysicalModal(selectedOrder)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Order Physically</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400">Physical courier included</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Order Physically" Modal */}
      {orderForPhysical && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">
                    Order Physical Stamp Paper
                  </h3>
                  <span className="text-xs text-slate-500">
                    Docket #{orderForPhysical.orderId} · {orderForPhysical.docTitle}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOrderForPhysical(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {courierSuccessMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-black">
                  Physical Dispatch Confirmed!
                </h4>
                <p className="text-xs text-slate-500">
                  Your physical stamp paper will be dispatched via Speed Post within 2 business days. Speed Post consignment details will be sent via SMS/WhatsApp.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmPhysicalDispatch} className="p-5 space-y-4 text-xs">
                {/* 2-Day Delivery Alert Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs font-bold">Important Dispatch Timeline Notice:</strong>
                    <p className="mt-0.5 text-amber-800 text-xs">
                      Delivery will take <strong>2 business days</strong> for physical dispatch via Speed Post. Your digital copy will still be provided immediately within <strong>1-2 hours</strong>.
                    </p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complete Shipping Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={courierAddress}
                    onChange={(e) => setCourierAddress(e.target.value)}
                    placeholder="House/Office No, Street, Landmark, Area, City, State"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  />
                </div>

                {/* Pincode & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pincode (6 digits) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={courierPincode}
                      onChange={(e) => setCourierPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 201301"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Recipient Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={courierPhone}
                      onChange={(e) => setCourierPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address for Speed Post Tracking (Optional)
                  </label>
                  <input
                    type="email"
                    value={courierEmail}
                    onChange={(e) => setCourierEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Fee Callout */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-black block">
                        Physical Courier Dispatch Fee
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Speed Post secure handling &amp; waterproof dossier
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-black text-blue-600">
                    +₹50
                  </span>
                </div>

                {/* Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderForPhysical(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Confirm Speed Post Dispatch (₹50)</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
