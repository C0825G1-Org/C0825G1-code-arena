// const fs = require('fs');

// try {
//   // 1. AdminProblemCreatePage
//   let createContent = fs.readFileSync('features/moderator/problem/CreatePage.tsx', 'utf8');
//   createContent = createContent
//     .replace(/export const CreatePage = \(\) => {/, 'export const AdminProblemCreatePage = () => {')
//     .replace(/import { ModeratorLayout } from '\.\.\/components\/ModeratorLayout';/, "import { AdminLayout } from '../../components/AdminLayout';")
//     .replace(/<ModeratorLayout>/, '<AdminLayout title="Soạn Bài Tập Mới" activeTab="problems">')
//     .replace(/<\/ModeratorLayout>/, '</AdminLayout>')
//     .replace(/\/moderator\/problems/g, '/admin/problems')
//     .replace(/from '\.\.\/services\/problemApi';/, "from '../../../moderator/problem/services/problemApi';");

//   fs.mkdirSync('features/admin/problem/page', { recursive: true });
//   fs.writeFileSync('features/admin/problem/page/AdminProblemCreatePage.tsx', createContent, 'utf8');

//   // 2. AdminProblemEditPage
//   let editContent = fs.readFileSync('features/moderator/problem/EditPage.tsx', 'utf8');
//   editContent = editContent
//     .replace(/export const EditPage = \(\) => {/, 'export const AdminProblemEditPage = () => {')
//     .replace(/import { ModeratorLayout } from '\.\.\/components\/ModeratorLayout';/, "import { AdminLayout } from '../../components/AdminLayout';")
//     .replace(/<ModeratorLayout>/, '<AdminLayout title="Chỉnh Sửa Bài Tập" activeTab="problems">')
//     .replace(/<\/ModeratorLayout>/, '</AdminLayout>')
//     .replace(/\/moderator\/problems/g, '/admin/problems')
//     .replace(/from '\.\.\/services\/problemApi';/, "from '../../../moderator/problem/services/problemApi';")
//     .replace(/onClick=\{handleDeleteTestCase\}/, "onClick={() => handleDeleteTestCase(prob)}") // Note: irrelevant replacement just copied over? 
//     // Wait EditPage uses problemApi
    
//   fs.writeFileSync('features/admin/problem/page/AdminProblemEditPage.tsx', editContent, 'utf8');

//   // 3. AdminTestcaseCreatePage
//   let tcContent = fs.readFileSync('features/moderator/testcase/CreatePage.tsx', 'utf8');
//   tcContent = tcContent
//     .replace(/export const CreatePage = \(\) => {/, 'export const AdminTestcaseCreatePage = () => {')
//     .replace(/import { ModeratorLayout } from '\.\.\/components\/ModeratorLayout';/, "import { AdminLayout } from '../../components/AdminLayout';")
//     .replace(/<ModeratorLayout headerTitle="Quản Lý Bộ TestCase">/, '<AdminLayout title="Quản Lý Bộ TestCase" activeTab="problems">')
//     .replace(/<\/ModeratorLayout>/, '</AdminLayout>')
//     .replace(/\/moderator\/problems/g, '/admin/problems')
//     .replace(/from '\.\.\/services\/problemApi';/, "from '../../../moderator/problem/services/problemApi';")
//     .replace(/from '\.\.\/services\/testcaseApi';/, "from '../../../moderator/testcase/services/testcaseApi';")
//     .replace(/from '\.\.\/\.\.\/\.\.\/app\/store';/, "from '../../../../app/store';")
//     .replace(/from '\.\/DeleteModal';/, "from './DeleteModal';");

//   fs.mkdirSync('features/admin/testcase/page', { recursive: true });
//   fs.writeFileSync('features/admin/testcase/page/AdminTestcaseCreatePage.tsx', tcContent, 'utf8');

//   console.log("Pages regenerated successfully in UTF-8!");
// } catch (e) {
//   console.error("Error generating pages:", e);
//   process.exit(1);
// }
