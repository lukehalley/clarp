'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Project } from '@/types/project';

// Import the shared detail page component
import EntityDetailPage from '@/components/terminal/EntityDetailPage';
import WalletGate from '@/components/auth/WalletGate';

export default function OrgPage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;

    const fetchEntity = async () => {
      try {
        setIsLoading(true);
        let res = await fetch(`/api/projects/${entityId}`);

        if (!res.ok && res.status === 404) {
          res = await fetch(`/api/projects?q=${encodeURIComponent(entityId)}`);
          const data = await res.json();
          if (data.projects && data.projects.length > 0) {
            const entity = data.projects[0];
            // Redirect if not an organization
            if (entity.entityType && entity.entityType !== 'organization') {
              const route = entity.entityType === 'person' ? 'person' : 'project';
              router.replace(`/terminal/${route}/${entity.xHandle || entity.id}`);
              return;
            }
            setProject(entity);
            return;
          }
          setProject(null);
          return;
        }

        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const entity = data.project || data;

        // Redirect if not an organization
        if (entity.entityType && entity.entityType !== 'organization') {
          const route = entity.entityType === 'person' ? 'person' : 'project';
          router.replace(`/terminal/${route}/${entity.xHandle || entity.id}`);
          return;
        }

        setProject(entity);
      } catch (err) {
        console.error('[OrgPage] Failed to fetch:', err);
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntity();
  }, [entityId, router]);

  return (
    <WalletGate showPreview={true}>
      <EntityDetailPage
        project={project}
        isLoading={isLoading}
        expectedEntityType="organization"
      />
    </WalletGate>
  );
}
