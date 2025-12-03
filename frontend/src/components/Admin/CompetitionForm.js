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
  });

  const [instantWinTicketsInput, setInstantWinTicketsInput] = useState('');

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await uploadFile(file);
      
      // Determine if it's image or video
      const isVideo = file.type.startsWith('video/');
      setFormData((prev) => ({
        ...prev,
        [isVideo ? 'video' : 'image']: data.url,
        [isVideo ? 'image' : 'video']: '', // Clear the other field
      }));

      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
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

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        max_tickets: parseInt(formData.max_tickets),
        sold: parseInt(formData.sold) || 0,
        prize_value: formData.prize_value
          ? parseFloat(formData.prize_value)
          : null,
      };

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
      alert(error.response?.data?.detail || 'Failed to save competition');
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
            <h2 className="section-title">Media</h2>

            <div className="form-group">
              <label>Upload Image or Video</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && <p className="upload-status">Uploading...</p>}
            </div>

            {formData.image && (
              <div className="media-preview">
                <label>Current Image:</label>
                <img src={formData.image} alt="Preview" />
              </div>
            )}

            {formData.video && (
              <div className="media-preview">
                <label>Current Video:</label>
                <video src={formData.video} controls />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="image">Image URL (or upload above)</label>
                <input
                  id="image"
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="video">Video URL (or upload above)</label>
                <input
                  id="video"
                  type="url"
                  name="video"
                  value={formData.video}
                  onChange={handleChange}
                  placeholder="https://..."
                />
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