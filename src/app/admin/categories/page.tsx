'use client';

import React, { useState, useEffect } from 'react';
import { locationService } from '@/services/locationService';
import { Category } from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tag, Plus, Check, EyeOff } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const cats = await locationService.getCategories();
      setCategories(cats);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Gestão de Categorias</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Controle de categorias ativas e visíveis nas buscas do portal
          </p>
        </div>
        <Badge variant="gold">{categories.length} categorias</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {categories.map((cat) => (
          <Card key={cat.id} variant="glass" padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{cat.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>slug: /{cat.slug}</div>
            </div>
            <Badge variant={cat.status === 'active' ? 'success' : 'neutral'}>
              {cat.status === 'active' ? 'Ativa' : 'Inativa'}
            </Badge>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
