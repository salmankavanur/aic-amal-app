"use client";
import { useState, useEffect, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  X,
  ChevronDown,
  Copy,
  Check,
  Mail,
  User,
  CreditCard,
  Clock,
  CheckCircle,
  ArrowUpDown,
  Download,
  Printer,
  Info,
} from "lucide-react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => dateString; // Dates are pre-formatted by server

export default function InstitutionDonations({
  initialDonations,
  initialInstitutionDetails,
  initialError,
}) {
  const [donations, setDonations] = useState(initialDonations || []);
  const [loading, setLoading] = useState(false); // No initial loading
  const [error, setError] = useState(initialError || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [institutionDetails, setInstitutionDetails] = useState(initialInstitutionDetails);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [copiedField, setCopiedField] = useState("");

  const params = useParams();
  const institutionId = params.id;

  const fetchDonations = async () => {
    try {
      setIsRefreshing(true);
      
      const response = await fetch(`/api/institutions/${institutionId}/donations`,{
        method: 'GET',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch donations: ${response.status}`);
      const data = await response.json();
      const formattedData = (data.message ? [] : data).map((d) => ({
        ...d,
        createdAt: new Date(d.createdAt || d.paymentDate).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      }));
      setDonations(formattedData);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDonations()
    if (copiedField) {
      const timer = setTimeout(() => setCopiedField(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedField]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => setCopiedField(field));
  };

  const openDetailModal = (donation) => {
    setSelectedDonation(donation);
    setIsDetailModalOpen(true);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedAndFilteredDonations = () => {
    const filtered = donations.filter((donation) => {
      const matchesSearch =
        (donation.name && donation.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (donation.email && donation.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (donation.phone && donation.phone.includes(searchTerm)) ||
        (donation.razorpayPaymentId && donation.razorpayPaymentId.includes(searchTerm));
      const matchesType = typeFilter === "all" || donation.type === typeFilter;
      const matchesStatus = statusFilter === "all" || donation.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const donationTypes = [...new Set(donations.map((d) => d.type))];
  const totalAmount = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
  const completedDonations = donations.filter((d) => d.status === "Completed");
  const pendingDonations = donations.filter((d) => d.status === "Pending");
  const totalCompletedAmount = completedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const sortedAndFilteredDonations = getSortedAndFilteredDonations();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin/institutions/list"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Institutions
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center mb-1">
            {institutionDetails?.name || "Institution"} Donations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track all donations for this institution
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchDonations}
            className="flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            className="flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Donations</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{donations.length}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                From {sortedAndFilteredDonations.length} filtered results
              </p>
            </div>
            <span className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              <CreditCard className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(totalAmount)}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatCurrency(totalCompletedAmount)} completed
              </p>
            </div>
            <span className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
              <CheckCircle className="h-5 w-5" />
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{completedDonations.length} Completed</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pendingDonations.length} pending</p>
            </div>
            <span className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full">
              <Clock className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, phone or payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-3 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
            >
              <option value="all">All Types</option>
              {donationTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
          <p className="flex items-center">
            <span className="flex-shrink-0 mr-2">⚠️</span>
            {error}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
        {sortedAndFilteredDonations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button className="flex items-center focus:outline-none" onClick={() => requestSort("name")}>
                      Donor
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button className="flex items-center focus:outline-none" onClick={() => requestSort("amount")}>
                      Amount
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button className="flex items-center focus:outline-none" onClick={() => requestSort("type")}>
                      Type
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button className="flex items-center focus:outline-none" onClick={() => requestSort("createdAt")}>
                      Date
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <button className="flex items-center focus:outline-none" onClick={() => requestSort("status")}>
                      Status
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {sortedAndFilteredDonations.map((donation) => (
                  <tr
                    key={donation._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => openDetailModal(donation)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {donation.name || "Anonymous Donor"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {donation.email || "No email provided"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(donation.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {donation.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(donation.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          donation.status === "Completed"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                        }`}
                      >
                        {donation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailModal(donation);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3 mb-4">
              <Info className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No donations found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
              {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                ? "No donations match your search criteria. Try adjusting your filters."
                : "This institution hasn't received any donations yet."}
            </p>
            {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      <Transition appear show={isDetailModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDetailModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  {selectedDonation && (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                          Donation Details
                        </Dialog.Title>
                        <button
                          onClick={() => setIsDetailModalOpen(false)}
                          className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Donation Amount</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(selectedDonation.amount)}
                            </p>
                          </div>
                          <span
                            className={`px-4 py-1 rounded-full text-sm font-medium ${
                              selectedDonation.status === "Completed"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            }`}
                          >
                            {selectedDonation.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Donor Information
                          </h4>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                              <span className="text-gray-900 dark:text-white">{selectedDonation.name || "Anonymous"}</span>
                              {selectedDonation.name && (
                                <button
                                  onClick={() => copyToClipboard(selectedDonation.name, "name")}
                                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                  title="Copy to clipboard"
                                >
                                  {copiedField === "name" ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                              <span className="text-gray-900 dark:text-white">
                                {selectedDonation.email || "Not provided"}
                              </span>
                              {selectedDonation.email && (
                                <div className="flex space-x-2">
                                  <a
                                    href={`mailto:${selectedDonation.email}`}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    title="Send email"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </a>
                                  <button
                                    onClick={() => copyToClipboard(selectedDonation.email, "email")}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                    title="Copy to clipboard"
                                  >
                                    {copiedField === "email" ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Payment Information
                          </h4>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Payment ID</label>
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                              <span className="text-gray-900 dark:text-white truncate max-w-[200px]">
                                {selectedDonation.razorpayPaymentId || "Not available"}
                              </span>
                              {selectedDonation.razorpayPaymentId && (
                                <button
                                  onClick={() => copyToClipboard(selectedDonation.razorpayPaymentId, "paymentId")}
                                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 ml-2"
                                  title="Copy to clipboard"
                                >
                                  {copiedField === "paymentId" ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Order ID</label>
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                              <span className="text-gray-900 dark:text-white truncate max-w-[200px]">
                                {selectedDonation.razorpayOrderId || "Not available"}
                              </span>
                              {selectedDonation.razorpayOrderId && (
                                <button
                                  onClick={() => copyToClipboard(selectedDonation.razorpayOrderId, "orderId")}
                                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 ml-2"
                                  title="Copy to clipboard"
                                >
                                  {copiedField === "orderId" ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Donation Type
                            </label>
                            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                              <span className="text-gray-900 dark:text-white">{selectedDonation.type}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
                            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                              <span className="text-gray-900 dark:text-white">{formatDate(selectedDonation.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Location Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">District</label>
                            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                              <span className="text-gray-900 dark:text-white">
                                {selectedDonation.district || "Not specified"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Panchayat</label>
                            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                              <span className="text-gray-900 dark:text-white">
                                {selectedDonation.panchayat || "Not specified"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={() => setIsDetailModalOpen(false)}
                        >
                          Close
                        </button>
                        {selectedDonation.status === "Pending" && (
                          <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => {
                              console.log("Mark as completed clicked");
                              // Implement status update functionality here
                            }}
                          >
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}