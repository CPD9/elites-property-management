import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const AdminCalendar = ({ userRole = 'admin' }) => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'payment',
    user_id: '',
    property_id: ''
  });

  const API_URL = 'http://localhost:3001/api';

  useEffect(() => {
    fetchCalendarData();
    if (userRole === 'admin') {
      fetchTenants();
      fetchProperties();
    }
  }, [userRole]);

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/calendar/events`);
      const formattedEvents = response.data.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_date),
        end: new Date(event.end_date),
        resource: {
          ...event,
          color: getEventColor(event.event_type)
        }
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/tenants`);
      setTenants(response.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/properties`);
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const getEventColor = (eventType) => {
    const colors = {
      payment: '#dc2626', // red
      maintenance: '#2563eb', // blue
      inspection: '#059669', // green
      lease: '#7c3aed', // purple
      meeting: '#ea580c' // orange
    };
    return colors[eventType] || '#6b7280';
  };

  const handleSelectSlot = ({ start, end }) => {
    if (userRole !== 'admin') return;
    
    setEventForm({
      title: '',
      description: '',
      start_date: moment(start).format('YYYY-MM-DDTHH:mm'),
      end_date: moment(end).format('YYYY-MM-DDTHH:mm'),
      event_type: 'payment',
      user_id: '',
      property_id: ''
    });
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource);
    setEventForm({
      title: event.resource.title,
      description: event.resource.description || '',
      start_date: moment(event.start).format('YYYY-MM-DDTHH:mm'),
      end_date: moment(event.end).format('YYYY-MM-DDTHH:mm'),
      event_type: event.resource.event_type,
      user_id: event.resource.user_id || '',
      property_id: event.resource.property_id || ''
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (selectedEvent) {
        // Update existing event
        await axios.put(`${API_URL}/calendar/events/${selectedEvent.id}`, eventForm);
        toast.success('Event updated successfully');
      } else {
        // Create new event
        await axios.post(`${API_URL}/calendar/events`, eventForm);
        toast.success('Event created successfully');
      }
      
      setShowEventModal(false);
      fetchCalendarData();
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !window.confirm('Are you sure you want to delete this event?')) return;

    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/calendar/events/${selectedEvent.id}`);
      toast.success('Event deleted successfully');
      setShowEventModal(false);
      fetchCalendarData();
      resetForm();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      event_type: 'payment',
      user_id: '',
      property_id: ''
    });
    setSelectedEvent(null);
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderColor: event.resource.color,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px'
      }
    };
  };

  const CustomToolbar = ({ label, onNavigate, onView }) => {
    return (
      <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">{label}</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('PREV')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Previous
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Next
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={view}
            onChange={(e) => onView(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value={Views.MONTH}>Month</option>
            <option value={Views.WEEK}>Week</option>
            <option value={Views.DAY}>Day</option>
            <option value={Views.AGENDA}>Agenda</option>
          </select>
          
          {userRole === 'admin' && (
            <button
              onClick={() => {
                resetForm();
                setShowEventModal(true);
              }}
              className="inline-flex items-center px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      {/* Event Legend */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Event Types</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
            <span>Payment Due</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
            <span>Inspection</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-600 rounded mr-2"></div>
            <span>Lease Related</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-600 rounded mr-2"></div>
            <span>Meeting</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', padding: '20px' }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable={userRole === 'admin'}
          popup
          eventPropGetter={eventStyleGetter}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          components={{
            toolbar: CustomToolbar
          }}
        />
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedEvent ? 'Edit Event' : 'Create Event'}
              </h3>
              <div className="flex space-x-2">
                {selectedEvent && userRole === 'admin' && (
                  <button
                    onClick={handleDeleteEvent}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  disabled={userRole !== 'admin'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  disabled={userRole !== 'admin'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Event Type</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm({...eventForm, event_type: e.target.value})}
                  disabled={userRole !== 'admin'}
                >
                  <option value="payment">Payment Due</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                  <option value="lease">Lease Related</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm({...eventForm, start_date: e.target.value})}
                    disabled={userRole !== 'admin'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm({...eventForm, end_date: e.target.value})}
                    disabled={userRole !== 'admin'}
                  />
                </div>
              </div>

              {userRole === 'admin' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tenant (Optional)</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={eventForm.user_id}
                      onChange={(e) => setEventForm({...eventForm, user_id: e.target.value})}
                    >
                      <option value="">Select Tenant</option>
                      {tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property (Optional)</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={eventForm.property_id}
                      onChange={(e) => setEventForm({...eventForm, property_id: e.target.value})}
                    >
                      <option value="">Select Property</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.id}>{property.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                {userRole === 'admin' && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : selectedEvent ? 'Update Event' : 'Create Event'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;