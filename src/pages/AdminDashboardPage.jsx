import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Shield,
  Users,
  Home,
  Calendar,
  Star,
  Trash2,
  ExternalLink,
  UserPlus,
  Edit3,
  Check,
  X,
  AlertCircle,
  MessageSquareWarning,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';

const API_BASE = 'http://localhost:5000';

export const AdminDashboardPage = () => {
  const { user, token, refreshUser } = useAuth();
  const { allProperties, refreshProperties } = useSearch();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'issues' | 'properties' | 'bookings' | 'reviews'
  const [usersList, setUsersList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [issuesList, setIssuesList] = useState([]);

  // Create User State
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    phone: '',
    role: 'GUEST',
    about: '',
  });

  // Edit User State
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'GUEST',
    password: '',
  });

  // Resolve Issue State
  const [resolutionText, setResolutionText] = useState({});

  const isAdmin = user?.role === 'ADMIN';

  const fetchAdminData = async () => {
    if (!isAdmin) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [usersRes, bookingsRes, issuesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/users`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/bookings`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/issues`, { headers }).catch(() => ({ data: [] })),
      ]);
      if (Array.isArray(usersRes.data)) setUsersList(usersRes.data);
      if (Array.isArray(bookingsRes.data)) setBookingsList(bookingsRes.data);
      if (Array.isArray(issuesRes.data)) setIssuesList(issuesRes.data);
    } catch (e) {
      console.error('Admin fetch error:', e);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token, isAdmin]);

  // Non-admin users CANNOT self-switch to Admin!
  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center p-6 bg-bgLight">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-borderLight shadow-modal text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-dark">
              Administrator Authority Required
            </h2>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Regular users (Guest / Host) cannot switch roles to Admin. Please sign in with dedicated System Administrator credentials to access this console.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to="/login"
              className="w-full py-3 bg-dark hover:bg-black text-white rounded-xl text-xs font-bold transition"
            >
              Go to Admin Login (`admin@abodex.com`)
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 text-xs font-bold text-secondary hover:text-dark"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin: Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_BASE}/api/admin/users`, newUserForm, { headers });
      setShowCreateUser(false);
      setNewUserForm({
        name: '',
        email: '',
        password: 'password123',
        phone: '',
        role: 'GUEST',
        about: '',
      });
      await fetchAdminData();
      showToast('Created new user account in PostgreSQL!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create user', 'error');
    }
  };

  // Admin: Start Editing User
  const startEditingUser = (u) => {
    setEditingUserId(u.id);
    setEditUserForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'GUEST',
      password: '',
    });
  };

  // Admin: Save User Update
  const handleUpdateUser = async (userId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(`${API_BASE}/api/admin/users/${userId}`, editUserForm, { headers });
      setEditingUserId(null);
      await fetchAdminData();
      if (userId === user?.id) await refreshUser();
      showToast('Updated user data in PostgreSQL!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update user', 'error');
    }
  };

  // Admin: Delete User
  const handleDeleteUser = async (userId, userName) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE}/api/admin/users/${userId}`, { headers });
      await fetchAdminData();
      await refreshProperties();
      showToast(`Deleted user "${userName}" and their data from PostgreSQL`, 'info');
    } catch (err) {
      showToast(err.response?.data?.error || 'Cannot delete user', 'error');
    }
  };

  // Admin: Resolve / Update User Issue
  const handleUpdateIssue = async (issueId, newStatus) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resolution = resolutionText[issueId];
      await axios.patch(
        `${API_BASE}/api/issues/${issueId}`,
        {
          status: newStatus,
          ...(resolution !== undefined && { adminResolution: resolution }),
        },
        { headers }
      );
      await fetchAdminData();
      showToast(`Issue marked as ${newStatus} in PostgreSQL!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update issue', 'error');
    }
  };

  const handleDeleteIssue = async (issueId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE}/api/issues/${issueId}`, { headers });
      await fetchAdminData();
      showToast('Support issue deleted from PostgreSQL', 'info');
    } catch {
      showToast('Failed to delete issue', 'error');
    }
  };

  const handleDeleteProperty = async (propId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE}/api/properties/${propId}`, { headers });
      await refreshProperties();
      showToast('Property removed from PostgreSQL!', 'info');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete property', 'error');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE}/api/bookings/${bookingId}`, { headers });
      await fetchAdminData();
      await refreshProperties();
      showToast('Booking deleted from PostgreSQL!', 'info');
    } catch {
      showToast('Failed to delete booking', 'error');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE}/api/reviews/${reviewId}`, { headers });
      await refreshProperties();
      showToast('Review removed and property rating recalculated in PostgreSQL!', 'info');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete review', 'error');
    }
  };

  const allReviewsFlattened = allProperties.flatMap((p) =>
    (p.reviews || []).map((r) => ({
      ...r,
      propertyId: p.id,
      propertyTitle: p.title,
    }))
  );

  const openIssuesCount = issuesList.filter((i) => i.status !== 'RESOLVED').length;

  return (
    <div className="bg-bgLight min-h-screen py-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold">
              <Shield className="w-3.5 h-3.5 text-airbnb" />
              <span>Full System Authority · {user?.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              StayFinder / AbodeX Admin Control Center
            </h1>
            <p className="text-xs sm:text-sm text-gray-300">
              Create, update, or delete users (Guest/Host) and their data, moderate listings & bookings, and resolve user support issues.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab('users');
              setShowCreateUser(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-airbnb hover:bg-airbnb-hover text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>

        {/* Platform KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-borderLight space-y-1">
            <div className="flex items-center justify-between text-secondary text-xs font-semibold">
              <span>Users</span>
              <Users className="w-4 h-4 text-airbnb" />
            </div>
            <p className="text-2xl font-extrabold text-dark">{usersList.length}</p>
            <p className="text-[11px] text-secondary">Full CRUD authority</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-borderLight space-y-1">
            <div className="flex items-center justify-between text-secondary text-xs font-semibold">
              <span>User Issues</span>
              <MessageSquareWarning className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-dark">{issuesList.length}</p>
            <p className="text-[11px] text-amber-700 font-semibold">
              {openIssuesCount} pending resolution
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-borderLight space-y-1">
            <div className="flex items-center justify-between text-secondary text-xs font-semibold">
              <span>Properties</span>
              <Home className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-dark">{allProperties.length}</p>
            <p className="text-[11px] text-secondary">Verified listings</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-borderLight space-y-1">
            <div className="flex items-center justify-between text-secondary text-xs font-semibold">
              <span>Bookings</span>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-dark">{bookingsList.length}</p>
            <p className="text-[11px] text-secondary">Platform reservations</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-borderLight space-y-1">
            <div className="flex items-center justify-between text-secondary text-xs font-semibold">
              <span>Reviews</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-dark">{allReviewsFlattened.length}</p>
            <p className="text-[11px] text-secondary">Guest feedback</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-1.5 border border-borderLight flex flex-wrap items-center gap-1.5">
          {[
            { id: 'users', label: `Users & Data (${usersList.length})` },
            { id: 'issues', label: `User Issues (${issuesList.length})` },
            { id: 'properties', label: `Listings (${allProperties.length})` },
            { id: 'bookings', label: `Bookings (${bookingsList.length})` },
            { id: 'reviews', label: `Reviews (${allReviewsFlattened.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === t.id ? 'bg-dark text-white' : 'text-secondary hover:text-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Users CRUD (Create, Edit, Delete Users & Their Data) */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {showCreateUser && (
              <form
                onSubmit={handleCreateUser}
                className="bg-white rounded-3xl p-6 border border-borderLight shadow-xs space-y-4 animate-fade-in"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-extrabold text-dark">
                    Create New User Account (PostgreSQL)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="p-1 text-secondary hover:text-dark"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-dark mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Uma Rohith"
                      value={newUserForm.name}
                      onChange={(e) =>
                        setNewUserForm({ ...newUserForm, name: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-borderLight text-xs font-medium text-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-dark mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rohith@example.com"
                      value={newUserForm.email}
                      onChange={(e) =>
                        setNewUserForm({ ...newUserForm, email: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-borderLight text-xs font-medium text-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-dark mb-1">
                      Initial Mode / Role
                    </label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) =>
                        setNewUserForm({ ...newUserForm, role: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-borderLight text-xs font-bold text-dark bg-white"
                    >
                      <option value="GUEST">GUEST (Standard User)</option>
                      <option value="HOST">HOST (Host Mode Active)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-dark mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 00000"
                      value={newUserForm.phone}
                      onChange={(e) =>
                        setNewUserForm({ ...newUserForm, phone: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-borderLight text-xs font-medium text-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-dark mb-1">
                      Password
                    </label>
                    <input
                      type="text"
                      value={newUserForm.password}
                      onChange={(e) =>
                        setNewUserForm({ ...newUserForm, password: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-borderLight text-xs font-medium text-dark"
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-dark hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Save User to PostgreSQL
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="bg-white rounded-3xl border border-borderLight overflow-hidden shadow-2xs divide-y divide-gray-100">
              {usersList.map((u) => {
                const isEditing = editingUserId === u.id;
                return (
                  <div
                    key={u.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 flex-1">
                      <img
                        src={
                          u.avatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                        }
                        alt={u.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
                      />

                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 flex-1">
                          <input
                            type="text"
                            value={editUserForm.name}
                            onChange={(e) =>
                              setEditUserForm({ ...editUserForm, name: e.target.value })
                            }
                            placeholder="Name"
                            className="p-2 rounded-xl border border-gray-300 text-xs font-semibold text-dark"
                          />
                          <input
                            type="email"
                            value={editUserForm.email}
                            onChange={(e) =>
                              setEditUserForm({ ...editUserForm, email: e.target.value })
                            }
                            placeholder="Email"
                            className="p-2 rounded-xl border border-gray-300 text-xs font-semibold text-dark"
                          />
                          <input
                            type="text"
                            value={editUserForm.phone}
                            onChange={(e) =>
                              setEditUserForm({ ...editUserForm, phone: e.target.value })
                            }
                            placeholder="Phone"
                            className="p-2 rounded-xl border border-gray-300 text-xs font-semibold text-dark"
                          />
                          <select
                            value={editUserForm.role}
                            onChange={(e) =>
                              setEditUserForm({ ...editUserForm, role: e.target.value })
                            }
                            className="p-2 rounded-xl border border-gray-300 text-xs font-bold text-dark bg-white"
                          >
                            <option value="GUEST">GUEST</option>
                            <option value="HOST">HOST</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-dark text-sm">{u.name}</p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-800'
                                  : u.role === 'HOST'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-secondary">
                            {u.email} {u.phone ? `· ${u.phone}` : ''}
                          </p>
                          <p className="text-[11px] text-secondary mt-0.5">
                            {u.bookingsCount} bookings · {u.propertiesCount} properties ·{' '}
                            {u.reviewsCount} reviews · {u.issuesCount || 0} issues
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-center">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateUser(u.id)}
                            className="flex items-center gap-1 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="p-2 border border-gray-200 rounded-xl text-secondary"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditingUser(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-dark rounded-xl text-xs font-semibold text-dark transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit User</span>
                          </button>
                          {u.id !== user?.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Solve User Issues & Support Tickets */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            {issuesList.map((issue) => (
              <div
                key={issue.id}
                className="bg-white rounded-3xl p-6 border border-borderLight shadow-2xs space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          issue.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : issue.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {issue.status}
                      </span>
                      <span className="text-xs font-bold text-airbnb">{issue.category}</span>
                      <span className="text-xs text-secondary">
                        · Reported by <strong>{issue.userName}</strong> ({issue.userEmail})
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-dark">{issue.subject}</h4>
                    <p className="text-xs sm:text-sm text-dark leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteIssue(issue.id)}
                    className="p-2 border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-xl text-xs transition cursor-pointer"
                    title="Delete Issue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Admin Resolution Box */}
                <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    placeholder="Write official Admin resolution / action taken for this user..."
                    value={
                      resolutionText[issue.id] !== undefined
                        ? resolutionText[issue.id]
                        : issue.adminResolution || ''
                    }
                    onChange={(e) =>
                      setResolutionText({ ...resolutionText, [issue.id]: e.target.value })
                    }
                    className="flex-1 p-2.5 rounded-xl border border-borderLight text-xs font-medium text-dark focus:border-dark focus:outline-none"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateIssue(issue.id, 'IN_PROGRESS')}
                      className="px-3.5 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Mark In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateIssue(issue.id, 'RESOLVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Resolve Issue
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Property Moderation */}
        {activeTab === 'properties' && (
          <div className="bg-white rounded-3xl border border-borderLight overflow-hidden shadow-2xs divide-y divide-gray-100">
            {allProperties.map((prop) => (
              <div
                key={prop.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={prop.images?.[0]}
                    alt={prop.title}
                    className="w-20 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <p className="text-sm font-bold text-dark">{prop.title}</p>
                    <p className="text-xs text-secondary">
                      {prop.location} · <strong>${prop.price}/night</strong> · Host:{' '}
                      {prop.host?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    to={`/rooms/${prop.id}`}
                    className="p-2 border border-gray-200 hover:border-dark rounded-xl text-dark"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteProperty(prop.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Listing</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Bookings Authority */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-3xl border border-borderLight overflow-hidden shadow-2xs divide-y divide-gray-100">
            {bookingsList.map((b) => (
              <div
                key={b.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-dark">{b.confirmationCode}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-dark">
                      {b.status}
                    </span>
                    <span className="text-secondary">
                      · Guest: <strong>{b.guestName}</strong>
                    </span>
                  </div>
                  <p className="text-sm font-bold text-dark mt-0.5">{b.title}</p>
                  <p className="text-xs text-secondary">
                    {b.checkIn} → {b.checkOut} · ${b.totalPrice}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteBooking(b.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-xl text-xs font-bold transition cursor-pointer self-end sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Booking</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: Review Moderation */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl border border-borderLight overflow-hidden shadow-2xs divide-y divide-gray-100">
            {allReviewsFlattened.map((rev) => (
              <div
                key={rev.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-dark">{rev.author}</span>
                    <span className="text-secondary">on</span>
                    <Link
                      to={`/rooms/${rev.propertyId}`}
                      className="font-bold text-airbnb hover:underline"
                    >
                      {rev.propertyTitle}
                    </Link>
                    <span className="flex items-center gap-0.5 font-bold text-dark">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {rev.rating}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-dark">{rev.comment}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteReview(rev.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 self-end sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Review</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
