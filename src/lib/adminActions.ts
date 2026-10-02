import toast from 'react-hot-toast';

export async function deleteAdminItem(endpoint: string, confirmMessage: string): Promise<boolean> {
  if (!confirm(confirmMessage)) return false;

  const res = await fetch(endpoint, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    toast.error(data.error || 'No se pudo eliminar');
    return false;
  }
  return true;
}
