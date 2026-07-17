// Mock Backend for simulating centralized server for Stripe and single-use licenses.
// In a real application, this would be an external API (e.g. Firebase, Supabase, Node.js Server).

export type LicenseType = 'single' | 'multiple';

export interface LicenseEntry {
  key: string;
  type: LicenseType;
  used: boolean;
  machineId?: string; // the hardware ID it's locked to
}

// Helper to simulate network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getDB = (): Record<string, LicenseEntry> => {
  if (typeof window === 'undefined') return {};
  const dbStr = localStorage.getItem('__MOCK_SERVER_DB__');
  if (dbStr) {
    try {
      return JSON.parse(dbStr);
    } catch {
      return {};
    }
  }
  return {};
};

const saveDB = (db: Record<string, LicenseEntry>) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('__MOCK_SERVER_DB__', JSON.stringify(db));
  }
};

export const MockBackend = {
  /**
   * Called by the "Stripe Webhook" simulator to generate and store a paid license.
   */
  generateAndRegisterLicense: async (type: LicenseType = 'single'): Promise<string> => {
    await delay(1500); // Simulate network
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomSeg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    // POS-AAAA-BBBB-CCCC-DDDD
    const key = `POS-${randomSeg()}-${randomSeg()}-${randomSeg()}-${randomSeg()}`;
    
    const db = getDB();
    db[key] = {
      key,
      type,
      used: false
    };
    saveDB(db);
    return key;
  },

  /**
   * Validates if a license exists, is unused (or belongs to the same machine), and claims it.
   */
  activateLicense: async (key: string, machineId: string): Promise<{ success: boolean; message: string; type?: LicenseType }> => {
    await delay(1000); // Simulate network
    const db = getDB();
    const entry = db[key];

    if (!entry) {
      return { success: false, message: 'La clave de licencia ingresada no existe en la base de datos central.' };
    }

    if (entry.type === 'single') {
      if (entry.used) {
        if (entry.machineId !== machineId) {
          return { success: false, message: 'Esta licencia es de ÚNICO USO y ya fue registrada en otra computadora. Adquiere una nueva licencia.' };
        } else {
          // Already used by THIS computer (e.g. restoring software)
          return { success: true, message: 'Licencia validada correctamente para esta computadora.', type: entry.type };
        }
      } else {
        // Claim the license
        entry.used = true;
        entry.machineId = machineId;
        saveDB(db);
        return { success: true, message: 'Licencia de un solo uso activada y enlazada a esta computadora.', type: entry.type };
      }
    } else if (entry.type === 'multiple') {
      // Multiple PC license - can be used anywhere
      entry.used = true; // Mark as started being used
      saveDB(db);
      return { success: true, message: 'Licencia Múltiple Premium activada.', type: entry.type };
    }

    return { success: false, message: 'Error desconocido en el servidor.' };
  }
};
