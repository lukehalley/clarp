import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjectById, getMockScore } from '@/lib/terminal/mock-data';
import ReportContent from './ReportContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const project = getProjectById(resolvedParams.id);

  if (!project) {
    return {
      title: 'Report Not Found - CLARP Terminal',
    };
  }

  const score = getMockScore(project.id);

  return {
    title: `${project.name} LARP Score: ${score.score} - CLARP Terminal`,
    description: `LARP Score analysis for ${project.name} (${project.ticker || 'N/A'}). Risk level: ${score.riskLevel}. Top flags: ${score.topTags.slice(0, 3).join(', ')}. Avoid rugs before you ape.`,
    openGraph: {
      title: `${project.name} LARP Score: ${score.score}`,
      description: `Risk: ${score.riskLevel.toUpperCase()} | ${score.topTags.slice(0, 3).join(' • ')}`,
      type: 'website',
      siteName: 'CLARP Terminal',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.name} LARP Score: ${score.score}`,
      description: `Risk: ${score.riskLevel.toUpperCase()} | ${score.topTags.slice(0, 3).join(' • ')}`,
    },
  };
}

export default async function ReportPage({ params }: PageProps) {
  const resolvedParams = await params;
  const project = getProjectById(resolvedParams.id);

  if (!project) {
    notFound();
  }

  const score = getMockScore(project.id);

  return <ReportContent project={project} score={score} />;
}
