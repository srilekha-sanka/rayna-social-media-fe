import { useParams } from 'react-router-dom';
import '../../styles/studio.css';
import '../../styles/pages.css';

const USE_CASES = {
  'image-to-video': {
    title: 'Image to Video',
    description: 'Transform product images into engaging videos with audio layers. AI generates motion, transitions, and syncs with background music.',
    icon: '🎬',
    tools: ['Kling', 'Seedance'],
    useCase: 'Use Case 2',
  },
  cinematic: {
    title: 'Cinematic Video',
    description: 'End-to-end cinematic video creation with AI-powered editing, professional transitions, and high-quality output.',
    icon: '🎥',
    tools: ['Veo3', 'Kling'],
    useCase: 'Use Case 3',
  },
  vlog: {
    title: 'Vlog / Human Style',
    description: 'Amateur human vlog-type content for authentic, relatable social media posts. Natural feel with AI-assisted editing.',
    icon: '📱',
    tools: [],
    useCase: 'Use Case 4',
  },
  remix: {
    title: 'Content Remix',
    description: 'Label existing content and create new variations using AI. Repurpose your best-performing content across platforms.',
    icon: '🔄',
    tools: [],
    useCase: 'Use Case 5',
  },
};

function ComingSoon() {
  const { type } = useParams();
  const config = USE_CASES[type] || USE_CASES['image-to-video'];

  return (
    <div>
      <div className="page-header">
        <h2>{config.title}</h2>
        <p>{config.useCase} — Content Studio</p>
      </div>

      <div className="panel">
        <div className="panel__body">
          <div className="coming-soon">
            <div className="coming-soon__icon">{config.icon}</div>
            <h2>{config.title}</h2>
            <p>{config.description}</p>
            {config.tools.length > 0 && (
              <div className="coming-soon__tools">
                {config.tools.map((tool) => (
                  <span key={tool} className="tool-tag">{tool}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComingSoon;
