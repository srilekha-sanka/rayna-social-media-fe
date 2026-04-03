import { useState, useCallback, useRef } from 'react';
import {
  MdSearch,
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdCloudUpload,
  MdClose,
} from 'react-icons/md';
import { searchStock } from '../../services/stockMedia';

const ORIENTATIONS = [
  { value: '', label: 'Any' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'square', label: 'Square' },
];

const MAX_SELECTION = 10;

export default function StockBrowser({
  onCompose,
  onBack,
  composing,
  nextLabel,
}) {
  const [term, setTerm] = useState('');
  const [orientation, setOrientation] = useState('');
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 0, total: 0 });
  const [selected, setSelected] = useState([]); // Array of { id, preview_url, title }
  const [uploadedFiles, setUploadedFiles] = useState([]); // Array of File objects
  const [uploadPreviews, setUploadPreviews] = useState([]); // Array of data URLs
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [applyOverlay, setApplyOverlay] = useState(true);
  const [generateCaption, setGenerateCaption] = useState(true);

  const fileInputRef = useRef(null);

  const doSearch = useCallback(async (page = 1) => {
    if (!term.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await searchStock({ term: term.trim(), page, limit: 20, orientation: orientation || undefined });
      setResults(res.results || []);
      setPagination(res.pagination || { page, total_pages: 0, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }, [term, orientation]);

  function handleSearch(e) {
    e.preventDefault();
    doSearch(1);
  }

  function toggleSelect(img) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === img.id);
      if (exists) return prev.filter((s) => s.id !== img.id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, { id: img.id, preview_url: img.preview_url || img.thumbnail_url, title: img.title }];
    });
  }

  function isSelected(id) {
    return selected.some((s) => s.id === id);
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_SELECTION - selected.length - uploadedFiles.length;
    const toAdd = files.slice(0, Math.max(0, remaining));

    setUploadedFiles((prev) => [...prev, ...toAdd]);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setUploadPreviews((prev) => [...prev, { name: file.name, url: reader.result }]);
      reader.readAsDataURL(file);
    });
  }

  function removeUpload(name) {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name));
    setUploadPreviews((prev) => prev.filter((p) => p.name !== name));
  }

  function handleCompose() {
    onCompose({
      selectedImages: selected,
      uploadedFiles,
      applyOverlay,
      generateCaption,
    });
  }

  const totalSelected = selected.length + uploadedFiles.length;
  const canCompose = totalSelected > 0 && !composing;

  return (
    <div className="csp__stock">
      <div className="csp__step-header">
        <button className="csp__back-btn" onClick={onBack}><MdChevronLeft /> Back</button>
        <h4>Stock Media</h4>
      </div>

      {error && (
        <div className="cc__alert cc__alert--error">
          {error}
          <button onClick={() => setError('')}><MdClose /></button>
        </div>
      )}

      {/* ── Search Bar ── */}
      <form className="csp__stock-search" onSubmit={handleSearch}>
        <div className="csp__stock-search-input-wrap">
          <MdSearch className="csp__stock-search-icon" />
          <input
            type="text"
            placeholder="Search stock photos..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="csp__stock-search-input"
          />
        </div>
        <select
          value={orientation}
          onChange={(e) => setOrientation(e.target.value)}
          className="csp__stock-orientation"
        >
          {ORIENTATIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button type="submit" className="btn btn--primary btn--sm" disabled={searching || !term.trim()}>
          {searching ? <span className="cc__spinner" /> : 'Search'}
        </button>
      </form>

      {/* ── Results Grid ── */}
      {results.length > 0 && (
        <>
          <div className="csp__stock-grid">
            {results.map((img) => (
              <div
                key={img.id}
                className={`csp__stock-item ${isSelected(img.id) ? 'csp__stock-item--selected' : ''}`}
                onClick={() => toggleSelect(img)}
              >
                <img src={img.thumbnail_url || img.preview_url} alt={img.title} />
                {isSelected(img.id) && (
                  <div className="csp__stock-check">
                    <MdCheckCircle />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {pagination.total_pages > 1 && (
            <div className="csp__stock-pagination">
              <button
                className="btn btn--outline btn--sm"
                disabled={pagination.page <= 1 || searching}
                onClick={() => doSearch(pagination.page - 1)}
              >
                <MdChevronLeft /> Prev
              </button>
              <span className="csp__stock-page-info">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                className="btn btn--outline btn--sm"
                disabled={pagination.page >= pagination.total_pages || searching}
                onClick={() => doSearch(pagination.page + 1)}
              >
                Next <MdChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Upload Section ── */}
      <div className="csp__stock-divider">
        <span>OR</span>
      </div>

      <button
        className="csp__upload-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={totalSelected >= MAX_SELECTION}
      >
        <MdCloudUpload /> Upload Your Own Images
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {uploadPreviews.length > 0 && (
        <div className="csp__upload-previews">
          {uploadPreviews.map((p) => (
            <div key={p.name} className="csp__upload-preview">
              <img src={p.url} alt={p.name} />
              <button className="csp__upload-remove" onClick={() => removeUpload(p.name)}>
                <MdClose />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Options ── */}
      <div className="csp__options-panel">
        <h5>Options</h5>
        <label className="csp__checkbox">
          <input type="checkbox" checked={applyOverlay} onChange={(e) => setApplyOverlay(e.target.checked)} />
          <span>Apply text overlay on images</span>
        </label>
        <label className="csp__checkbox">
          <input type="checkbox" checked={generateCaption} onChange={(e) => setGenerateCaption(e.target.checked)} />
          <span>Generate AI caption & hashtags</span>
        </label>
      </div>

      {/* ── Footer ── */}
      <div className="csp__step-footer">
        <span className="csp__selection-count">
          {totalSelected > 0 ? `${totalSelected} image${totalSelected > 1 ? 's' : ''} selected` : 'No images selected'}
        </span>
        <button className="btn btn--primary" onClick={handleCompose} disabled={!canCompose}>
          {composing ? <><span className="cc__spinner" /> Composing...</> : (nextLabel || 'Compose')}
        </button>
      </div>
    </div>
  );
}
