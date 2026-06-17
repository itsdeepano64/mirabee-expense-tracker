'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronRight, Filter, Leaf, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryExpenseCount,
} from '@/lib/actions/expenses';
import type { Category } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CAT_ICONS: Record<string, string> = {
  'Flowers & Plants': '🌸',
  'Wholesale Flowers': '🌷',
  Vases: '🏺',
  Tape: '🪢',
  Supplies: '📦',
  Rent: '🏠',
  Utilities: '⚡',
  Marketing: '📢',
  Payroll: '👥',
  Other: '•',
};

type CategoryFormState = {
  name: string;
  is_cogs_default: boolean;
  is_pinned: boolean;
};

const emptyForm = (): CategoryFormState => ({
  name: '',
  is_cogs_default: false,
  is_pinned: true,
});

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--mb-text)' }}>{label}</span>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="mb-toggle"
        data-checked={checked}
        aria-checked={checked}
        role="switch"
      />
    </div>
  );
}

function CategoryForm({
  form,
  saving,
  onNameChange,
  onCogsChange,
  onPinnedChange,
  onCancel,
  onSave,
  onDelete,
  saveLabel,
}: {
  form: CategoryFormState;
  saving: boolean;
  onNameChange: (name: string) => void;
  onCogsChange: () => void;
  onPinnedChange: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  saveLabel: string;
}) {
  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        autoFocus
        value={form.name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && form.name.trim() && onSave()}
        placeholder="Category name"
        className="mb-field"
        style={{ fontSize: 14 }}
      />
      <ToggleRow
        icon={<Leaf size={14} color="var(--mb-green)" />}
        label="Default to COGS"
        checked={form.is_cogs_default}
        onChange={onCogsChange}
      />
      <ToggleRow
        icon={<Filter size={14} color="var(--mb-blue)" />}
        label="Show in quick filters"
        checked={form.is_pinned}
        onChange={onPinnedChange}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 10,
            border: '1.5px solid var(--mb-border)',
            background: 'var(--mb-bg)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--mb-text-muted)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!form.name.trim() || saving}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 10,
            border: 'none',
            background: form.name.trim() ? 'var(--mb-blue)' : 'var(--mb-border)',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {saving ? 'Saving…' : (
            <>
              <Check size={13} />
              {saveLabel}
            </>
          )}
        </button>
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px',
            borderRadius: 10,
            border: '1.5px solid #F0C0CC',
            background: 'transparent',
            fontSize: 13,
            fontWeight: 700,
            color: '#993556',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={14} />
          Delete category
        </button>
      )}
    </div>
  );
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<CategoryFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteExpenseCount, setDeleteExpenseCount] = useState(0);
  const [renameValue, setRenameValue] = useState('');
  const [deleteMode, setDeleteMode] = useState<'confirm' | 'rename'>('confirm');

  async function refreshCategories() {
    setCategories(await getCategories());
  }

  useEffect(() => {
    refreshCategories().finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!addForm.name.trim()) return;
    setSaving(true);
    try {
      const result = await createCategory({
        name: addForm.name.trim(),
        is_cogs_default: addForm.is_cogs_default,
        is_pinned: addForm.is_pinned,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      await refreshCategories();
      toast.success(`"${addForm.name.trim()}" added`);
      setAddForm(emptyForm());
    } finally {
      setSaving(false);
    }
  }

  function startEdit(cat: Category) {
    setShowAdd(false);
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      is_cogs_default: cat.is_cogs_default,
      is_pinned: cat.is_pinned,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm());
  }

  async function handleSaveEdit() {
    if (!editingId || !editForm.name.trim()) return;
    setSaving(true);
    try {
      const result = await updateCategory(editingId, {
        name: editForm.name.trim(),
        is_cogs_default: editForm.is_cogs_default,
        is_pinned: editForm.is_pinned,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      await refreshCategories();
      toast.success('Category updated');
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteClick() {
    if (!editingId) return;
    const cat = categories.find((c) => c.id === editingId);
    if (!cat) return;

    const countResult = await getCategoryExpenseCount(editingId);
    if ('error' in countResult) {
      toast.error(countResult.error);
      return;
    }

    setDeleteTarget(cat);
    setDeleteExpenseCount(countResult.count);
    setRenameValue(cat.name);

    if (countResult.count > 0) {
      setDeleteMode('rename');
    } else {
      setDeleteMode('confirm');
    }
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const result = await deleteCategory(deleteTarget.id);
      if (result.error) {
        if ('expenseCount' in result && result.expenseCount) {
          setDeleteExpenseCount(result.expenseCount);
          setDeleteMode('rename');
          return;
        }
        toast.error(result.error);
        return;
      }
      await refreshCategories();
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteDialogOpen(false);
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function handleRename() {
    if (!deleteTarget || !renameValue.trim()) return;
    setSaving(true);
    try {
      const result = await updateCategory(deleteTarget.id, {
        name: renameValue.trim(),
        is_cogs_default: editForm.is_cogs_default,
        is_pinned: editForm.is_pinned,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      await refreshCategories();
      toast.success(`Renamed to "${renameValue.trim()}"`);
      setDeleteDialogOpen(false);
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: 'var(--mb-text-muted)',
          textTransform: 'uppercase',
          marginBottom: 8,
          paddingLeft: 2,
        }}
      >
        Categories
      </div>

      <div className="mb-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div className="mb-skeleton" style={{ width: 34, height: 34, borderRadius: 10 }} />
                <div className="mb-skeleton" style={{ flex: 1, height: 13 }} />
              </div>
            ))}
          </div>
        ) : categories.length === 0 && !showAdd ? (
          <div style={{ padding: '20px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--mb-text-muted)', margin: '0 0 12px' }}>
              No categories yet. Add your first one below.
            </p>
          </div>
        ) : (
          categories.map((cat, i) =>
            editingId === cat.id ? (
              <div
                key={cat.id}
                style={{
                  borderBottom: i < categories.length - 1 || showAdd ? '1px solid var(--mb-border)' : 'none',
                }}
              >
                <CategoryForm
                  form={editForm}
                  saving={saving}
                  onNameChange={(name) => setEditForm((f) => ({ ...f, name }))}
                  onCogsChange={() => setEditForm((f) => ({ ...f, is_cogs_default: !f.is_cogs_default }))}
                  onPinnedChange={() => setEditForm((f) => ({ ...f, is_pinned: !f.is_pinned }))}
                  onCancel={cancelEdit}
                  onSave={handleSaveEdit}
                  onDelete={handleDeleteClick}
                  saveLabel="Save"
                />
              </div>
            ) : (
              <button
                key={cat.id}
                type="button"
                onClick={() => startEdit(cat)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 16px',
                  borderBottom:
                    i < categories.length - 1 || showAdd ? '1px solid var(--mb-border)' : 'none',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: cat.is_cogs_default ? 'var(--mb-green-light)' : 'var(--mb-blue-xlight)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  {CAT_ICONS[cat.name] ?? '•'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--mb-text)' }}>
                    {cat.name}
                  </div>
                  {cat.is_cogs_default && (
                    <div
                      style={{
                        fontSize: 10.5,
                        color: 'var(--mb-green-dark)',
                        fontWeight: 600,
                        marginTop: 1,
                      }}
                    >
                      COGS default
                    </div>
                  )}
                </div>
                {cat.is_pinned && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      background: 'var(--mb-blue-xlight)',
                      color: 'var(--mb-blue-dark)',
                      padding: '2px 7px',
                      borderRadius: 5,
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    Pinned
                  </span>
                )}
                <ChevronRight size={16} color="var(--mb-text-soft)" style={{ flexShrink: 0 }} />
              </button>
            )
          )
        )}

        {!showAdd ? (
          <button
            type="button"
            onClick={() => {
              cancelEdit();
              setShowAdd(true);
              setAddForm(emptyForm());
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 16px',
              borderTop: categories.length > 0 ? '1px solid var(--mb-border)' : 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mb-blue)',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'var(--mb-blue-xlight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={15} color="var(--mb-blue)" />
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Add category</span>
          </button>
        ) : (
          <div
            style={{
              borderTop: categories.length > 0 ? '1px solid var(--mb-border)' : 'none',
            }}
          >
            <CategoryForm
              form={addForm}
              saving={saving}
              onNameChange={(name) => setAddForm((f) => ({ ...f, name }))}
              onCogsChange={() => setAddForm((f) => ({ ...f, is_cogs_default: !f.is_cogs_default }))}
              onPinnedChange={() => setAddForm((f) => ({ ...f, is_pinned: !f.is_pinned }))}
              onCancel={() => {
                setShowAdd(false);
                setAddForm(emptyForm());
              }}
              onSave={handleAdd}
              saveLabel="Save"
            />
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent style={{ maxWidth: 340, margin: '0 16px' }}>
          {deleteMode === 'confirm' ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This category has no expenses. It will be removed permanently.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#993556',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Deleting…' : 'Delete'}
                </button>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Can&apos;t delete {deleteTarget?.name}</AlertDialogTitle>
                <AlertDialogDescription>
                  This category has {deleteExpenseCount} expense
                  {deleteExpenseCount === 1 ? '' : 's'} and can&apos;t be deleted. Rename it
                  instead — all expenses will keep their history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="mb-field"
                style={{ fontSize: 14, width: '100%' }}
                placeholder="New category name"
              />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
                <button
                  type="button"
                  onClick={handleRename}
                  disabled={saving || !renameValue.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--mb-blue)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: saving || !renameValue.trim() ? 'not-allowed' : 'pointer',
                    opacity: saving || !renameValue.trim() ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Rename & keep expenses'}
                </button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}