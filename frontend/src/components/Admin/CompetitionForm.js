import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { competitionsAPI, uploadFile } from '../../services/api';
import './CompetitionForm.css';

const CompetitionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    price: '',
    sale_price: '',
    max_tickets: '',
    max_tickets_per_user: '',
    sold: 0,
    image: '',
    video: '',
    category: 'all',
    tags: [],
    hot: false,
    instant: false,
    prize_value: '',
    end_datetime: '',
    instant_win_image: '',
    instant_win_type: 'site_credit',
    instant_win_ticket_numbers: [],
    benefits: [],
    how_it_works: [],
    bulk_bundles: [],
  });

  const [instantWinTicketsInput, setInstantWinTicketsInput] = useState('');
  const [benefitsInput, setBenefitsInput] = useState('');
  const [howItWorksInput, setHowItWorksInput] = useState('');
  const [bulkBundlesInput, setBulkBundlesInput] = useState('10:0,25:5,50:10,100:15');

  // Preset options
  const benefitsPresets = {
    none: [],
    cash: ['Tax-free cash prize', 'Instant bank transfer', 'No purchase necessary', 'Guaranteed payout'],
    property: ['Property transfer included', 'All legal fees covered', 'Stamp duty paid', 'Ready to move in'],
    car: ['Full insurance for 1 year', 'Road tax paid', 'Delivery to your door', 'Full manufacturer warranty'],
    experience: ['All expenses paid', '5-star accommodation', 'Premium flight tickets', 'VIP treatment throughout']
  };

  const howItWorksPresets = {
    none: [],
    standard: [
      { step_number: 1, step_text: 'Purchase your competition tickets' },
      { step_number: 2, step_text: 'Live draw conducted at competition end' },
      { step_number: 3, step_text: 'Winner verification within 48 hours' },
      { step_number: 4, step_text: 'Prize delivered or transferred to winner' }
    ],
    instant: [
      { step_number: 1, step_text: 'Choose your ticket quantity' },
      { step_number: 2, step_text: 'Reveal instant wins immediately' },
      { step_number: 3, step_text: 'Main prize drawn at competition end' },
      { step_number: 4, step_text: 'All prizes credited or delivered' }
    ],
    rolling: [
      { step_number: 1, step_text: 'Buy tickets for the rolling jackpot' },
      { step_number: 2, step_text: 'Weekly draws every Friday' },
      { step_number: 3, step_text: 'Jackpot rolls over if not won' },
      { step_number: 4, step_text: 'Winners announced within 24 hours' }
    ]
  };

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchCompetition();
    }
  }, [id]);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const { data } = await competitionsAPI.getById(id);
      setFormData({
        ...data,
        price: data.price.toString(),
        sale_price: data.sale_price?.toString() || '',
        max_tickets: data.max_tickets.toString(),
        max_tickets_per_user: data.max_tickets_per_user?.toString() || '',
        prize_value: data.prize_value?.toString() || '',
        end_datetime: data.end_datetime || '',
        category: data.category || 'all',
        tags: data.tags || [],
        instant_win_image: data.instant_win_image || '',
        instant_win_type: data.instant_win_type || 'site_credit',
        instant_win_ticket_numbers: data.instant_win_ticket_numbers || [],
      });
      
      // Set instant win tickets input
      if (data.instant_win_ticket_numbers?.length > 0) {
        setInstantWinTicketsInput(data.instant_win_ticket_numbers.join(', '));
      }
    } catch (error) {
      console.error('Failed to fetch competition:', error);
      alert('Failed to load competition');
      navigate('/admin/competitions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleInstantWinTicketsChange = (e) => {
    const value = e.target.value;
    setInstantWinTicketsInput(value);
    
    // Parse comma-separated numbers
    const numbers = value
      .split(',')
      .map(n => n.trim())
      .filter(n => n !== '')
      .map(n => parseInt(n))
      .filter(n => !isNaN(n));
    
    setFormData((prev) => ({
      ...prev,
      instant_win_ticket_numbers: numbers,
    }));
  };

  const handleFileUpload = async (e, fieldName = 'featured') => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const { data } = await uploadFile(file);
      
      // Construct full URL
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const fullUrl = `${backendUrl}${data.url}`;
      
      if (fieldName === 'instant_win') {
        // Update instant win image
        setFormData((prev) => ({
          ...prev,
          instant_win_image: fullUrl,
        }));
      } else {
        // Determine if it's image or video for featured media
        const isVideo = file.type.startsWith('video/');
        setFormData((prev) => ({
          ...prev,
          [isVideo ? 'video' : 'image']: fullUrl,
          [isVideo ? 'image' : 'video']: '', // Clear the other field
        }));
      }

      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.detail || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.subtitle.trim()) {
      newErrors.subtitle = 'Subtitle is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0.01) {
      newErrors.price = 'Price must be at least £0.01';
    }

    const maxTickets = parseInt(formData.max_tickets);
    if (isNaN(maxTickets) || maxTickets < 1) {
      newErrors.max_tickets = 'Max tickets must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Clean up payload - remove any fields that shouldn't be sent
      const payload = {
        title: formData.title,
        subtitle: formData.subtitle || '',
        description: formData.description || '',
        price: parseFloat(formData.price),
        sale_price: formData.sale_price && formData.sale_price.toString().trim() !== '' ? parseFloat(formData.sale_price) : null,
        video: formData.video || '',
        image: formData.image || '',
        hot: formData.hot || false,
        instant: formData.instant || false,
        max_tickets: parseInt(formData.max_tickets),
        max_tickets_per_user: formData.max_tickets_per_user && formData.max_tickets_per_user.toString().trim() !== '' ? parseInt(formData.max_tickets_per_user) : null,
        tickets_sold: 0,
        sold_override: parseInt(formData.sold) || 0,
        end_datetime: formData.end_datetime || '',
        category: formData.category || 'all',
        tags: formData.tags || [],
        instant_wins: [],
        instant_win_image: formData.instant_win_image || '',
        instant_win_type: formData.instant_win_type || 'site_credit',
        instant_win_ticket_numbers: formData.instant_win_ticket_numbers || [],
        instant_wins_found: 0,
        prize_value: formData.prize_value && formData.prize_value.toString().trim() !== '' ? formData.prize_value.toString() : '0',
        benefits: []
      };

      console.log('Submitting payload:', payload);

      if (isEdit) {
        await competitionsAPI.update(id, payload);
        alert('Competition updated successfully!');
      } else {
        await competitionsAPI.create(payload);
        alert('Competition created successfully!');
      }

      navigate('/admin/competitions');
    } catch (error) {
      console.error('Failed to save competition:', error);
      
      // Better error handling
      let errorMessage = 'Failed to save competition';
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors
          errorMessage = error.response.data.detail
            .map(err => `${err.loc?.join('.')}: ${err.msg}`)
            .join('\n');
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading competition...</p>
      </div>
    );
  }

  return (
    <div className="competition-form-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          {isEdit ? 'Edit Competition' : 'Create Competition'}
        </h1>
        <p className="admin-page-subtitle">
          {isEdit
            ? 'Update competition details'
            : 'Add a new competition to your platform'}
        </p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="competition-form">
          {/* Basic Info Section */}
          <section className="form-section">
            <h2 className="section-title">Basic Information</h2>

            <div className="form-group">
              <label htmlFor="title" className="required">
                Title
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., £10,000 Cash Prize"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="subtitle" className="required">
                Subtitle
              </label>
              <input
                id="subtitle"
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="e.g., Life-changing cash prize"
                className={errors.subtitle ? 'error' : ''}
              />
              {errors.subtitle && (
                <span className="error-text">{errors.subtitle}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="category" className="required">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="all">All</option>
                <option value="jackpot">Jackpot</option>
                <option value="spin">Spin</option>
                <option value="instawin">Instawin</option>
                <option value="rolling">Rolling</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="required">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the competition..."
                rows={4}
                className={errors.description ? 'error' : ''}
              />
              {errors.description && (
                <span className="error-text">{errors.description}</span>
              )}
            </div>
          </section>

          {/* Pricing Section */}
          <section className="form-section">
            <h2 className="section-title">Pricing & Tickets</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price" className="required">
                  Entry Price (£)
                </label>
                <input
                  id="price"
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.99"
                  step="0.01"
                  min="0.01"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="sale_price">Sale Price (£)</label>
                <input
                  id="sale_price"
                  type="number"
                  name="sale_price"
                  value={formData.sale_price}
                  onChange={handleChange}
                  placeholder="0.79"
                  step="0.01"
                  min="0.01"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Optional - discounted price</small>
              </div>

              <div className="form-group">
                <label htmlFor="max_tickets" className="required">
                  Max Tickets
                </label>
                <input
                  id="max_tickets"
                  type="number"
                  name="max_tickets"
                  value={formData.max_tickets}
                  onChange={handleChange}
                  placeholder="10000"
                  min="1"
                  className={errors.max_tickets ? 'error' : ''}
                />
                {errors.max_tickets && (
                  <span className="error-text">{errors.max_tickets}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="max_tickets_per_user">Max Tickets Per User</label>
                <input
                  id="max_tickets_per_user"
                  type="number"
                  name="max_tickets_per_user"
                  value={formData.max_tickets_per_user}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Optional - limit per user</small>
              </div>

              <div className="form-group">
                <label htmlFor="sold">Tickets Sold (%)</label>
                <input
                  id="sold"
                  type="number"
                  name="sold"
                  value={formData.sold}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="prize_value">Prize Value (£)</label>
                <input
                  id="prize_value"
                  type="number"
                  name="prize_value"
                  value={formData.prize_value}
                  onChange={handleChange}
                  placeholder="10000"
                  step="0.01"
                />
              </div>
            </div>
          </section>

          {/* Media Section */}
          <section className="form-section">
            <h2 className="section-title">Featured Media</h2>
            <div style={{ 
              background: '#f0f8ff', 
              padding: '12px 16px', 
              borderRadius: '6px', 
              marginBottom: '20px',
              border: '1px solid #d0e8ff'
            }}>
              <strong style={{ color: '#0066cc', fontSize: '14px' }}>📐 Recommended Image Size:</strong>
              <p style={{ margin: '4px 0 0 0', color: '#333', fontSize: '13px' }}>
                <strong>1200x800px</strong> (3:2 ratio) or larger. Max file size: 10MB
              </p>
            </div>

            <div className="form-group">
              <label>Upload Featured Image or Video</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => handleFileUpload(e, 'featured')}
                disabled={uploading}
                style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
              />
              {uploading && <p className="upload-status">⏳ Uploading file...</p>}
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                This will be the main image/video shown on competition cards
              </small>
            </div>

            {formData.image && (
              <div className="media-preview">
                <label>Current Image:</label>
                <img src={formData.image} alt="Preview" />
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({...prev, image: ''}))}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Remove Image
                </button>
              </div>
            )}

            {formData.video && (
              <div className="media-preview">
                <label>Current Video:</label>
                <video src={formData.video} controls />
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({...prev, video: ''}))}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Remove Video
                </button>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="image">Or Enter Image URL</label>
                <input
                  id="image"
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Paste external image URL if not uploading</small>
              </div>

              <div className="form-group">
                <label htmlFor="video">Or Enter Video URL</label>
                <input
                  id="video"
                  type="url"
                  name="video"
                  value={formData.video}
                  onChange={handleChange}
                  placeholder="https://example.com/video.mp4"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Paste external video URL if not uploading</small>
              </div>
            </div>
          </section>

          {/* Settings Section */}
          <section className="form-section">
            <h2 className="section-title">Settings</h2>

            <div className="form-group">
              <label htmlFor="end_datetime">End Date & Time</label>
              <input
                id="end_datetime"
                type="datetime-local"
                name="end_datetime"
                value={formData.end_datetime}
                onChange={handleChange}
              />
            </div>

            <div className="checkboxes-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="hot"
                  checked={formData.hot}
                  onChange={handleChange}
                />
                <span>Hot Odds</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="instant"
                  checked={formData.instant}
                  onChange={handleChange}
                />
                <span>Instant Win</span>
              </label>
            </div>
          </section>

          {/* Instant Wins Section */}
          <section className="form-section">
            <h2 className="section-title">Instant Wins Configuration</h2>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              Configure instant win prizes that can be revealed immediately after purchase.
            </p>

            <div style={{ 
              background: '#fff8dc', 
              padding: '12px 16px', 
              borderRadius: '6px', 
              marginBottom: '20px',
              border: '1px solid #ffe4a8'
            }}>
              <strong style={{ color: '#cc8800', fontSize: '14px' }}>📐 Recommended Instant Win Image Size:</strong>
              <p style={{ margin: '4px 0 0 0', color: '#333', fontSize: '13px' }}>
                <strong>800x800px</strong> (square) or <strong>600x400px</strong> (3:2 ratio). Max file size: 10MB
              </p>
            </div>

            <div className="form-group">
              <label>Upload Instant Win Reveal Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'instant_win')}
                disabled={uploading}
                style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
              />
              {uploading && <p className="upload-status">⏳ Uploading image...</p>}
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                This image appears when users reveal their instant win prize
              </small>
            </div>

            {formData.instant_win_image && (
              <div className="media-preview">
                <label>Current Instant Win Image:</label>
                <img src={formData.instant_win_image} alt="Instant Win Preview" style={{ maxWidth: '400px' }} />
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({...prev, instant_win_image: ''}))}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Remove Image
                </button>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="instant_win_image">Or Enter Image URL</label>
              <input
                id="instant_win_image"
                type="url"
                name="instant_win_image"
                value={formData.instant_win_image}
                onChange={handleChange}
                placeholder="https://example.com/instant-win.jpg"
              />
              <small style={{ color: '#666', fontSize: '12px' }}>Paste external image URL if not uploading</small>
            </div>

            <div className="form-group">
              <label htmlFor="instant_win_type">Prize Type</label>
              <select
                id="instant_win_type"
                name="instant_win_type"
                value={formData.instant_win_type}
                onChange={handleChange}
              >
                <option value="site_credit">Site Credit</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="instant_win_tickets">
                Winning Ticket Numbers
              </label>
              <textarea
                id="instant_win_tickets"
                value={instantWinTicketsInput}
                onChange={handleInstantWinTicketsChange}
                placeholder="Enter ticket numbers separated by commas, e.g., 12, 33, 103, 1000, 2547"
                rows={6}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Comma-separated ticket numbers that will win instant prizes
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount of Instants</label>
                <input
                  type="text"
                  value={formData.instant_win_ticket_numbers.length}
                  disabled
                  style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Auto-calculated</small>
              </div>

              <div className="form-group">
                <label>Found</label>
                <input
                  type="text"
                  value="0"
                  disabled
                  style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Auto-tracked</small>
              </div>

              <div className="form-group">
                <label>Remaining</label>
                <input
                  type="text"
                  value={formData.instant_win_ticket_numbers.length - 0}
                  disabled
                  style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Auto-calculated</small>
              </div>
            </div>

            {formData.instant_win_ticket_numbers.length > 0 && (
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '6px',
                  marginTop: '12px',
                }}
              >
                <strong style={{ fontSize: '14px' }}>
                  Preview ({formData.instant_win_ticket_numbers.length} tickets):
                </strong>
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#666',
                    maxHeight: '100px',
                    overflow: 'auto',
                  }}
                >
                  {formData.instant_win_ticket_numbers.slice(0, 50).join(', ')}
                  {formData.instant_win_ticket_numbers.length > 50 && '...'}
                </div>
              </div>
            )}
          </section>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/competitions')}
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || uploading}
            >
              {loading
                ? 'Saving...'
                : isEdit
                ? 'Update Competition'
                : 'Create Competition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompetitionForm;