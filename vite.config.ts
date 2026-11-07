import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Configurazione unica per Vite (compilazione) e Vitest (test).
export default defineConfig({
  // './' rende i percorsi relativi: serve per aprire il file con doppio clic,
  // senza un server web.
  base: './',
  // Il plugin single-file incolla JavaScript e CSS dentro l'HTML:
  // il risultato è un solo file autosufficiente, dist/gioco.html.
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Codice compatibile anche con browser di qualche anno fa (2020 in poi),
    // non solo con le ultime versioni.
    target: 'es2020',
    rollupOptions: {
      // Usiamo gioco.html come pagina di ingresso, così il file compilato
      // si chiama già dist/gioco.html.
      input: 'gioco.html',
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
