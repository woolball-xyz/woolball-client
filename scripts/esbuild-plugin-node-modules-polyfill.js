/**
 * Plugin para o esbuild que ajuda a lidar com importações de módulos do Node.js
 * em builds para o navegador, fornecendo polyfills ou ignorando importações
 * quando apropriado.
 */

module.exports = {
  name: 'node-modules-polyfill',
  setup(build) {
    // Intercepta importações de módulos do Node.js
    build.onResolve({ filter: /^node:/ }, (args) => {
      console.log(`Ignorando importação de módulo Node.js: ${args.path}`);
      // Retorna um objeto vazio para módulos do Node.js
      return {
        path: args.path,
        namespace: 'node-modules-polyfill',
      };
    });

    // Fornece um conteúdo vazio para os módulos do Node.js
    build.onLoad({ filter: /.*/, namespace: 'node-modules-polyfill' }, (args) => {
      // Cria diferentes mocks dependendo do módulo que está sendo importado
      let contents = '';
      
      if (args.path === 'node:worker_threads') {
        contents = 'export const Worker = null; export default { Worker: null };';
      } else if (args.path === 'node:path') {
        contents = 'export const join = () => ""; export default { join: () => "" };';
      } else if (args.path === 'node:fs') {
        contents = 'export const existsSync = () => false; export const mkdirSync = () => {}; export const writeFileSync = () => {}; export const unlinkSync = () => {}; export default { existsSync: () => false, mkdirSync: () => {}, writeFileSync: () => {}, unlinkSync: () => {} };';
      } else {
        contents = 'export default {}; export const __esModule = true;';
      }
      
      return {
        contents,
        loader: 'js',
      };
    });
  },
};