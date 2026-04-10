import { useNavigate } from 'react-router-dom';
import { MdImage, MdVideocam, MdMovie, MdPersonalVideo, MdAutoAwesome, MdArrowForward } from 'react-icons/md';
import '../../styles/pages.css';
import '../../styles/studio.css';

const USE_CASES = [
  {
    id: 'carousel',
    title: 'Marketing WOW (AI Posters)',
    subtitle: 'Use Case 1',
    description: 'Create high-impact cinematic flyers and multi-image collages. AI generates magnetic hooks and stunning overlays.',
    icon: <MdAutoAwesome />,
    tag: 'Marketing WOW',
    live: true,
    path: '/studio/carousel',
  },
  {
    id: 'collage',
    title: 'Master Collage',
    subtitle: 'Use Case 2',
    description: 'Sophisticated Polaroid-style layouts with 4+ AI images. Professional editorial magazine style.',
    icon: <MdImage />,
    tag: 'High Impact',
    live: true,
    path: '/studio/carousel', // Reuse the carousel engine which handles templates
  },
  {
    id: 'image-to-video',
    title: 'Image to Video',
    subtitle: 'Use Case 3',
    description: 'Transform product images into engaging videos with audio layer.',
    icon: <MdVideocam />,
    tag: 'AI Video',
    tools: ['Kling', 'Seedance'],
    live: false,
    path: '/studio/image-to-video',
  },
  {
    id: 'cinematic',
    title: 'Cinematic Video',
    subtitle: 'Use Case 4',
    description: 'End-to-end cinematic video creation with AI-powered editing.',
    icon: <MdMovie />,
    tag: 'AI Pro',
    tools: ['Veo3', 'Kling'],
    live: false,
    path: '/studio/cinematic',
  },
  {
    id: 'remix',
    title: 'Content Remix',
    subtitle: 'Use Case 5',
    description: 'Label existing content and create new variations using AI.',
    icon: <MdAutoAwesome />,
    tag: 'Remix',
    live: false,
    path: '/studio/remix',
  },
];

function ContentStudioHome() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <h2>Content Studio</h2>
        <p>Choose a content creation workflow. AI does the heavy lifting.</p>
      </div>

      <div className="content-types-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {USE_CASES.map((uc) => (
          <div
            key={uc.id}
            className="content-type-card"
            onClick={() => navigate(uc.path)}
            style={{ cursor: 'pointer', opacity: uc.live ? 1 : 0.85 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="content-type-card__tag">
                {uc.tag}
              </span>
              {uc.live ? (
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: '#dcfce7', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  Live
                </span>
              ) : (
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: '#f1f5f9', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  Coming Soon
                </span>
              )}
            </div>

            {/* Icon + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                width: 36, height: 36, borderRadius: 8,
                background: uc.live ? 'var(--gradient-brand)' : '#f1f5f9',
                color: uc.live ? '#fff' : '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {uc.icon}
              </span>
              <div>
                <h4 className="content-type-card__title">{uc.title}</h4>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{uc.subtitle}</span>
              </div>
            </div>

            <p className="content-type-card__desc">{uc.description}</p>

            {/* Tools */}
            {uc.tools && uc.tools.length > 0 && (
              <div className="content-type-card__tools">
                {uc.tools.map((tool) => (
                  <span key={tool} className="tool-tag">{tool}</span>
                ))}
              </div>
            )}

            {/* CTA */}
            {uc.live && (
              <div style={{
                marginTop: 14, display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 13, fontWeight: 600, color: 'var(--primary)',
              }}>
                Start Creating <MdArrowForward size={16} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ContentStudioHome;
