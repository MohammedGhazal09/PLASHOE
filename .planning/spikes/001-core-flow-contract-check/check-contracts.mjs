import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const spikeDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(spikeDir, '../../..');

const rel = {
  app: 'Frontend/Ecommerce-main/my-app/src/App.js',
  contactPage: 'Frontend/Ecommerce-main/my-app/src/pages/Contact.jsx',
  checkoutPage: 'Frontend/Ecommerce-main/my-app/src/pages/Checkout.jsx',
  ordersApi: 'Frontend/Ecommerce-main/my-app/src/api/ordersApi.js',
  cartStore: 'Frontend/Ecommerce-main/my-app/src/store/cartStore.js',
  cartController: 'Backend/controllers/cartController.js',
  orderController: 'Backend/controllers/orderController.js',
  cartRoutes: 'Backend/routes/cartRoutes.js',
  orderRoutes: 'Backend/routes/orderRoutes.js',
  contactRoutes: 'Backend/routes/contactRoutes.js',
  productModel: 'Backend/models/Product.js',
};

function read(key) {
  return fs.readFileSync(path.join(root, rel[key]), 'utf8');
}

function lineOf(text, pattern) {
  const lines = text.split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(pattern));
  return index === -1 ? null : index + 1;
}

function lineOfAfter(text, anchor, pattern) {
  const lines = text.split(/\r?\n/);
  const anchorIndex = lines.findIndex((line) => line.includes(anchor));
  if (anchorIndex === -1) return lineOf(text, pattern);
  const index = lines.findIndex((line, offset) => offset > anchorIndex && line.includes(pattern));
  return index === -1 ? null : index + 1;
}

function sourceAfter(text, anchor) {
  const index = text.indexOf(anchor);
  return index === -1 ? text : text.slice(index);
}

function check(id, title, status, evidence, recommendation) {
  return { id, title, status, evidence, recommendation };
}

const app = read('app');
const contactPage = read('contactPage');
const checkoutPage = read('checkoutPage');
const ordersApi = read('ordersApi');
const cartStore = read('cartStore');
const cartController = read('cartController');
const orderController = read('orderController');
const cartRoutes = read('cartRoutes');
const orderRoutes = read('orderRoutes');
const contactRoutes = read('contactRoutes');
const productModel = read('productModel');

const checks = [];

const contactExportsSubmit = /contactApi\s*=\s*{[\s\S]*submit\s*:/.test(ordersApi);
const contactCallsSend = /contactApi\.send\s*\(/.test(contactPage);
checks.push(check(
  'contact-wrapper-method',
  'Contact page calls a method exported by the contact API wrapper',
  contactExportsSubmit && contactCallsSend ? 'FAIL' : 'PASS',
  contactCallsSend
    ? `Contact page calls contactApi.send at ${rel.contactPage}:${lineOf(contactPage, 'contactApi.send')}; wrapper exports submit at ${rel.ordersApi}:${lineOf(ordersApi, 'submit: async')}.`
    : 'Contact page call matches the wrapper export.',
  'Use contactApi.submit(name, email, subject, message), or add a send(formData) wrapper that calls POST /api/contact.'
));

const catchReportsSuccess = /catch\s*\([^)]*\)\s*{[\s\S]*toast\.success/.test(contactPage);
checks.push(check(
  'contact-error-honesty',
  'Contact submission reports failures honestly',
  catchReportsSuccess ? 'FAIL' : 'PASS',
  catchReportsSuccess
    ? `Catch block shows toast.success in ${rel.contactPage}:${lineOf(contactPage, 'Still show success for demo') || lineOf(contactPage, 'toast.success')}.`
    : 'Contact catch path does not show success.',
  'Show an error toast in the catch path and preserve form contents unless the POST succeeds.'
));

const checkoutProtected = /path="checkout"[\s\S]*<ProtectedRoute>/.test(app);
const checkoutHasGuestBranch = /Mock order for guests|Create an account to track your orders/.test(checkoutPage);
checks.push(check(
  'guest-checkout-reachability',
  'Checkout routing matches checkout business rules',
  checkoutProtected && checkoutHasGuestBranch ? 'FAIL' : 'PASS',
  checkoutProtected && checkoutHasGuestBranch
    ? `Route is protected in ${rel.app}:${lineOf(app, 'path="checkout"')}, but guest checkout branch exists in ${rel.checkoutPage}:${lineOf(checkoutPage, 'Mock order for guests')}.`
    : 'Checkout route protection and checkout branches are aligned.',
  'Either remove the guest checkout branch or make /checkout public and implement a deliberate guest order flow.'
));

const checkoutUsesResultDiscount = /result\.discount/.test(checkoutPage);
const storeReturnsDiscount = /return\s*{\s*success:\s*true\s*,\s*message\s*:\s*response\.message\s*,\s*discount/.test(cartStore);
checks.push(check(
  'coupon-result-contract',
  'Coupon application return shape matches checkout UI expectations',
  checkoutUsesResultDiscount && !storeReturnsDiscount ? 'FAIL' : 'PASS',
  checkoutUsesResultDiscount && !storeReturnsDiscount
    ? `Checkout reads result.discount at ${rel.checkoutPage}:${lineOf(checkoutPage, 'result.discount')}, but cartStore applyCoupon returns success/message without discount at ${rel.cartStore}:${lineOf(cartStore, 'return { success: true')}.`
    : 'Coupon result shape matches checkout usage.',
  'Return discount from cartStore.applyCoupon or read the updated discount value from store state in Checkout.'
));

const checkoutComputesDiscountAmount = /subtotal\s*\*\s*discount\s*\/\s*100/.test(checkoutPage);
const checkoutShowsRawDiscountAsMoney = /-\$\{discount\.toFixed\(2\)\}/.test(checkoutPage);
checks.push(check(
  'coupon-summary-discount-display',
  'Checkout order summary treats coupon discount as a percentage',
  checkoutComputesDiscountAmount && !checkoutShowsRawDiscountAsMoney ? 'PASS' : 'FAIL',
  checkoutComputesDiscountAmount && !checkoutShowsRawDiscountAsMoney
    ? 'Checkout computes a discount amount from subtotal and percentage.'
    : `Checkout may display percentage discount as a dollar amount in ${rel.checkoutPage}:${lineOf(checkoutPage, 'discount.toFixed')}.`,
  'Render the order-summary discount as subtotal * discount / 100 and label the percentage separately.'
));

const removeCouponLine = lineOf(cartController, 'export const removeCoupon');
const populateLine = lineOfAfter(cartController, 'export const removeCoupon', "await cart.populate('items.product'");
const removeCouponBody = sourceAfter(cartController, 'export const removeCoupon');
const missingCartReturnsNullData = /if\s*\(!cart\)\s*{[\s\S]*return\s+res\.json\(\s*{[\s\S]*data:\s*null[\s\S]*}\s*\)/.test(removeCouponBody);
checks.push(check(
  'remove-coupon-null-cart',
  'Removing a coupon handles a missing cart',
  missingCartReturnsNullData ? 'PASS' : 'FAIL',
  missingCartReturnsNullData
    ? 'removeCoupon returns a successful empty-cart response before populate when no cart exists.'
    : populateLine
    ? `removeCoupon starts at ${rel.cartController}:${removeCouponLine} and can call cart.populate at ${rel.cartController}:${populateLine} after a missing cart.`
    : 'removeCoupon does not show a safe missing-cart response.',
  'Return a successful empty-cart response when no cart exists, or create/load a cart before populating.'
));

const routesProtected =
  /router\.use\(protect\)/.test(cartRoutes) &&
  /router\.use\(protect\)/.test(orderRoutes) &&
  /router\.post\(\s*['"]\/['"][\s\S]*submitContact\s*\)/.test(contactRoutes);
checks.push(check(
  'route-auth-boundaries',
  'Core route auth boundaries match the intended storefront flow',
  routesProtected ? 'PASS' : 'FAIL',
  routesProtected
    ? `Cart and order routers apply router.use(protect); contact POST remains public in ${rel.contactRoutes}.`
    : 'One or more core route auth boundaries did not match the expected pattern.',
  'Keep cart and order routes protected, and keep public contact submission separate from admin contact routes.'
));

const checkoutStatesDemoPayment = /No real payment will be processed|automatically confirmed/.test(checkoutPage);
const orderAutoProcessing = /status:\s*'processing'|status.*processing/.test(orderController);
checks.push(check(
  'payment-production-readiness',
  'Checkout has a production payment state',
  checkoutStatesDemoPayment && orderAutoProcessing ? 'WARN' : 'PASS',
  checkoutStatesDemoPayment
    ? `Checkout announces demo payment behavior in ${rel.checkoutPage}:${lineOf(checkoutPage, 'No real payment')}; orders are created without a payment provider.`
    : 'No demo payment copy detected in checkout.',
  'Add a payment provider contract before production: payment intent creation, confirmation, failure handling, order payment status, and refund path.'
));

const productHasStock = /stock\s*:/.test(productModel);
const cartChecksStock = /stock/.test(cartController);
const orderChecksStock = /stock/.test(orderController);
checks.push(check(
  'inventory-enforcement',
  'Stock is enforced during cart and order workflows',
  productHasStock && (!cartChecksStock || !orderChecksStock) ? 'WARN' : 'PASS',
  productHasStock && (!cartChecksStock || !orderChecksStock)
    ? `Product stock exists in ${rel.productModel}:${lineOf(productModel, 'stock:')}, but cart/order controllers do not consistently validate or decrement it.`
    : 'Stock model and workflow enforcement appear aligned.',
  'Validate stock in cart add/update and atomically decrement or reserve stock during order creation.'
));

const summary = {
  generated_at: new Date().toISOString(),
  spike: '001-core-flow-contract-check',
  verdict: 'VALIDATED',
  counts: checks.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {}),
  checks,
};

const statusOrder = { FAIL: 0, WARN: 1, PASS: 2 };
const reportLines = [
  '# Core Flow Contract Check Report',
  '',
  `Generated: ${summary.generated_at}`,
  '',
  `Verdict: ${summary.verdict}`,
  '',
  '| Status | Check | Evidence | Recommendation |',
  '| --- | --- | --- | --- |',
  ...checks
    .slice()
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
    .map((item) => `| ${item.status} | ${item.title} | ${item.evidence.replace(/\|/g, '\\|')} | ${item.recommendation.replace(/\|/g, '\\|')} |`),
  '',
];

fs.writeFileSync(path.join(spikeDir, 'results.json'), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(spikeDir, 'contract-report.md'), `${reportLines.join('\n')}\n`);

console.log(JSON.stringify(summary.counts));
