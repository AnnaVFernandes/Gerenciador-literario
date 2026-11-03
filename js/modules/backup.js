import { state, setWorks } from "./state.js";
import { MAX_BACKUP_SIZE } from "./constants.js";
import { normalizeWork, persist } from "./storage.js";
import { toast } from "./toast.js";
import { render } from "./render.js";
import { $ } from "./utils.js";

export function initBackup() {
  $("#export-backup").addEventListener("click", () => {
    const backup = {
      app: "Cozy Library",
      version: 1,
      exportedAt: new Date().toISOString(),
      works: state.works,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cozy-library-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Backup exportado! Guarde o arquivo em um local seguro ♡");
  });

  $("#import-backup").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_BACKUP_SIZE)
      return toast("O arquivo é grande demais. O limite é 10 MB.");

    try {
      const data = JSON.parse(await file.text());
      const incoming = Array.isArray(data) ? data : data.works;

      if (!Array.isArray(incoming))
        throw new Error("Esse arquivo não parece ser um backup válido.");

      if (
        !confirm(
          `Importar ${incoming.length} obra(s)? A biblioteca atual será substituída. Exporte um backup antes se quiser guardar os dados atuais.`,
        )
      )
        return;

      const imported = incoming.map(normalizeWork).filter(Boolean);
      const previous = state.works;
      setWorks(imported);

      if (
        !persist(state.works, {
          onError: () =>
            toast(
              "Não foi possível salvar. O armazenamento pode estar cheio; tente reduzir as imagens locais.",
            ),
        })
      ) {
        setWorks(previous);
        return;
      }

      render();
      toast(`Backup importado: ${state.works.length} obra(s) ♡`);
    } catch (error) {
      toast(error.message || "Não foi possível ler esse backup.");
    }
  });
}
