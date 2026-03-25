import { useState } from 'react';
import { MdCheck, MdAutoAwesome } from 'react-icons/md';
import ProductSelector from '../components/carousel/ProductSelector';
import CarouselConfig from '../components/carousel/CarouselConfig';
import CarouselPreview from '../components/carousel/CarouselPreview';
import { generateCarousel } from '../services/api';
import '../styles/pages.css';
import '../styles/carousel.css';

const STEPS = [
  { label: 'Select Product' },
  { label: 'Configure' },
  { label: 'Preview & Publish' },
];

function ContentStudio() {
  const [step, setStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [platform, setPlatform] = useState('instagram');
  const [slideCount, setSlideCount] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [carouselData, setCarouselData] = useState(null);
  const [error, setError] = useState(null);

  function handleProductSelect(product) {
    setSelectedProduct(product);
    setStep(1);
  }

  async function handleGenerate() {
    try {
      setGenerating(true);
      setError(null);
      const res = await generateCarousel({
        product_id: selectedProduct.id,
        platform,
        slide_count: slideCount,
      });
      setCarouselData(res.data);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function handleBackToProducts() {
    setStep(0);
    setCarouselData(null);
  }

  function handleBackToConfig() {
    setStep(1);
    setCarouselData(null);
  }

  return (
    <div>
      <div className="page-header">
        <h2>Content Studio</h2>
        <p>Create beautiful carousel posts — select a product, configure, and publish.</p>
      </div>

      {/* Wizard Steps */}
      <div className="wizard-steps">
        {STEPS.map((s, i) => {
          let state = '';
          if (i < step) state = 'done';
          else if (i === step) state = 'active';
          return (
            <div key={i} className={`wizard-step wizard-step--${state}`}>
              <div className="wizard-step__number">
                {i < step ? <MdCheck size={16} /> : i + 1}
              </div>
              <span className="wizard-step__label">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Step 0: Select Product */}
      {step === 0 && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Choose a Product</h3>
          </div>
          <ProductSelector
            selectedProduct={selectedProduct}
            onSelect={handleProductSelect}
          />
        </div>
      )}

      {/* Step 1: Configure */}
      {step === 1 && !generating && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Configure Carousel</h3>
          </div>

          <CarouselConfig
            product={selectedProduct}
            platform={platform}
            setPlatform={setPlatform}
            slideCount={slideCount}
            setSlideCount={setSlideCount}
            onBack={handleBackToProducts}
          />

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div className="wizard-footer">
            <button className="btn btn--outline" onClick={handleBackToProducts}>
              Back
            </button>
            <button className="btn btn--primary" onClick={handleGenerate}>
              <MdAutoAwesome /> Generate Carousel
            </button>
          </div>
        </div>
      )}

      {/* Generating State */}
      {generating && (
        <div className="card">
          <div className="generating-state">
            <div className="generating-spinner" />
            <h3>Creating your carousel...</h3>
            <p>AI is generating captions, hashtags, and overlay images. This may take a moment.</p>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && carouselData && (
        <>
          <CarouselPreview data={carouselData} onBack={handleBackToConfig} />
          <div className="wizard-footer">
            <button className="btn btn--outline" onClick={handleBackToConfig}>
              Re-configure
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ContentStudio;
