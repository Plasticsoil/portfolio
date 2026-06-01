/* ══════════════════════════════════════════════════════════════
   Sphere work-card — a live, slowly-rotating wireframe sphere that
   speeds up and tilts toward the cursor on hover. White-on-black,
   with a centered SPHERE logo (drop-shadow lifts it off the mesh)
   and a grain layer for noise. Falls back to the static thumbnail
   if WebGL/three.js is unavailable.

   buildCard() (in index.html) creates the .card-sphere-canvas /
   .card-sphere-logo / .card-grain nodes; this script (deferred)
   wires them up once three.js has loaded.
════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var LOGO_SVG =
    '<svg width="144" height="24" viewBox="0 0 144 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sphere">' +
    '<g transform="translate(12,12)"><circle cx="0" cy="0" r="12" fill="currentColor"/></g>' +
    '<path d="M44.1104 0.980469C45.6001 1.0005 46.9298 1.25524 48.0996 1.74512C49.2695 2.23508 50.2501 2.94974 51.04 3.88965C51.83 4.81956 52.4 5.95975 52.75 7.30957L48.3398 8.05957C48.1798 7.35979 47.885 6.76993 47.4551 6.29004C47.0251 5.8101 46.5101 5.44531 45.9102 5.19531C45.3202 4.94531 44.6998 4.81004 44.0498 4.79004C43.41 4.77007 42.8052 4.8597 42.2354 5.05957C41.6754 5.24957 41.2155 5.53041 40.8555 5.90039C40.5055 6.27033 40.3301 6.70984 40.3301 7.21973C40.3301 7.68964 40.4748 8.07503 40.7646 8.375C41.0546 8.665 41.4204 8.90008 41.8604 9.08008C42.3002 9.26002 42.7501 9.4103 43.21 9.53027L46.96 10.5498C47.52 10.6998 48.1403 10.9004 48.8203 11.1504C49.5 11.3903 50.1498 11.7301 50.7695 12.1699C51.3995 12.5999 51.9154 13.1699 52.3154 13.8799C52.7254 14.5899 52.9297 15.4901 52.9297 16.5801C52.9297 17.74 52.6853 18.755 52.1953 19.625C51.7154 20.4849 51.065 21.1996 50.2451 21.7695C49.4251 22.3295 48.4951 22.7503 47.4551 23.0303C46.4251 23.3103 45.3598 23.4502 44.2598 23.4502C42.6599 23.4502 41.2147 23.1703 39.9248 22.6104C38.6448 22.0404 37.5898 21.2297 36.7598 20.1797C35.94 19.1199 35.4202 17.8601 35.2002 16.4004L39.46 15.7695C39.76 17.0095 40.3803 17.9648 41.3203 18.6348C42.2603 19.3047 43.3303 19.6396 44.5303 19.6396C45.2002 19.6396 45.8506 19.5352 46.4805 19.3252C47.1103 19.1152 47.6255 18.8045 48.0254 18.3945C48.4351 17.9846 48.6396 17.4797 48.6396 16.8799C48.6396 16.6599 48.6051 16.45 48.5352 16.25C48.4752 16.04 48.3697 15.845 48.2197 15.665C48.0698 15.4851 47.855 15.3152 47.5752 15.1553C47.3052 14.9953 46.96 14.8497 46.54 14.7197L40.9297 13.0703C40.5097 12.9503 40.0199 12.7795 39.46 12.5596C38.9102 12.3396 38.3753 12.025 37.8555 11.6152C37.3355 11.2052 36.8998 10.6651 36.5498 9.99512C36.2098 9.31512 36.04 8.45969 36.04 7.42969C36.0401 5.98002 36.405 4.7753 37.1348 3.81543C37.8647 2.85552 38.8397 2.13992 40.0596 1.66992C41.2796 1.19992 42.6304 0.970468 44.1104 0.980469ZM64.1465 1.40039C64.3565 1.40039 64.6373 1.40969 64.9873 1.42969C65.3472 1.4397 65.6674 1.46955 65.9473 1.51953C67.2372 1.71955 68.2924 2.14496 69.1123 2.79492C69.9422 3.4449 70.5524 4.26495 70.9424 5.25488C71.3324 6.23487 71.5273 7.33006 71.5273 8.54004C71.5273 9.75 71.3267 10.8499 70.9268 11.8398C70.5368 12.8198 69.9267 13.6352 69.0967 14.2852C68.2768 14.935 67.227 15.3596 65.9473 15.5596C65.6674 15.5996 65.3472 15.6304 64.9873 15.6504C64.6273 15.6704 64.3465 15.6797 64.1465 15.6797H59.1074V23H55.0273V1.40039H64.1465ZM77.4189 10.2803H87.0791V1.40039H91.1582V23H87.0791V14.0898H77.4189V23H73.3389V1.40039H77.4189V10.2803ZM108.27 5.20996H98.25V9.83008H106.47V13.6396H98.25V19.1904H108.27V23H94.1699V1.40039H108.27V5.20996ZM119.785 1.40039C119.995 1.40039 120.275 1.4097 120.625 1.42969C120.985 1.43968 121.305 1.46957 121.585 1.51953C122.875 1.71952 123.93 2.145 124.75 2.79492C125.58 3.44489 126.19 4.26495 126.58 5.25488C126.97 6.23488 127.165 7.33004 127.165 8.54004C127.165 10.35 126.715 11.9004 125.815 13.1904C125.26 13.9806 124.509 14.5823 123.564 14.999L127.465 23H122.846L119.298 15.6797H114.745V23H110.665V1.40039H119.785ZM143.663 5.20996H133.643V9.83008H141.863V13.6396H133.643V19.1904H143.663V23H129.562V1.40039H143.663V5.20996ZM59.1074 11.8701H63.9668C64.1768 11.8701 64.4072 11.8598 64.6572 11.8398C64.907 11.8198 65.1368 11.7797 65.3467 11.7197C65.8967 11.5697 66.3221 11.3197 66.6221 10.9697C66.922 10.6098 67.1273 10.215 67.2373 9.78516C67.3573 9.34517 67.417 8.93003 67.417 8.54004C67.417 8.15004 67.3573 7.73957 67.2373 7.30957C67.1273 6.86972 66.922 6.4749 66.6221 6.125C66.3221 5.765 65.8967 5.51035 65.3467 5.36035C65.1368 5.3004 64.907 5.26024 64.6572 5.24023C64.4072 5.22023 64.1768 5.20996 63.9668 5.20996H59.1074V11.8701ZM114.745 11.8701H119.605C119.815 11.8701 120.045 11.8598 120.295 11.8398C120.545 11.8198 120.775 11.7797 120.985 11.7197C121.535 11.5697 121.96 11.3196 122.26 10.9697C122.56 10.6098 122.765 10.2151 122.875 9.78516C122.995 9.34517 123.056 8.93003 123.056 8.54004C123.056 8.15004 122.995 7.73957 122.875 7.30957C122.765 6.86975 122.56 6.47488 122.26 6.125C121.96 5.76516 121.535 5.51033 120.985 5.36035C120.775 5.30035 120.545 5.26023 120.295 5.24023C120.045 5.22026 119.815 5.20997 119.605 5.20996H114.745V11.8701Z" fill="currentColor"/>' +
    '</svg>';

  function initOne(canvas) {
    if (!window.THREE || canvas._sphereInited) return;
    var THREE = window.THREE;
    var body = canvas.parentElement;
    var card = canvas.closest('.card-b');

    // inject the centered logo
    var logoEl = body.querySelector('.card-sphere-logo');
    if (logoEl && !logoEl.innerHTML) logoEl.innerHTML = LOGO_SVG;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    } catch (e) { return; }              // no WebGL → static poster stays visible
    canvas._sphereInited = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x0a0a0a, 1);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 4.6;

    var tilt = new THREE.Group();        // pointer tilt (pitch/yaw offset)
    var spin = new THREE.Group();        // continuous auto-rotation
    tilt.add(spin); scene.add(tilt);
    tilt.rotation.x = 0.28;              // slight top-down base view

    var R = 1.5;
    var wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(R, 40, 26)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 })
    );
    spin.add(wire);
    var dots = new THREE.Points(
      new THREE.SphereGeometry(R, 30, 20),
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.85,
        sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    spin.add(dots);

    function resize() {
      var w = body.clientWidth, h = body.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(body);
    resize();

    // hover: speed up + tilt toward pointer
    var hover = false, px = 0, py = 0, curSpeed = 0.0015;
    if (card) {
      card.addEventListener('pointerenter', function () { hover = true; });
      card.addEventListener('pointerleave', function () { hover = false; px = 0; py = 0; });
      card.addEventListener('pointermove', function (e) {
        var r = body.getBoundingClientRect();
        px = ((e.clientX - r.left) / r.width) * 2 - 1;
        py = ((e.clientY - r.top) / r.height) * 2 - 1;
      });
    }

    var visible = true;
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.01 }).observe(body);
    }

    function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      var goal = hover ? 0.0055 : 0.0015;          // slow drift → faster on hover
      curSpeed += (goal - curSpeed) * 0.05;
      spin.rotation.y += curSpeed;
      var targX = 0.28 + (hover ? py * 0.45 : 0);   // pitch toward cursor
      var targY = hover ? px * 0.5 : 0;             // yaw toward cursor
      tilt.rotation.x += (targX - tilt.rotation.x) * 0.06;
      tilt.rotation.y += (targY - tilt.rotation.y) * 0.06;
      renderer.render(scene, camera);
    }
    frame();
  }

  function initAll() {
    if (!window.THREE) { setTimeout(initAll, 120); return; }   // wait for three.js
    var list = document.querySelectorAll('.card-sphere-canvas');
    for (var i = 0; i < list.length; i++) initOne(list[i]);
  }

  if (document.readyState !== 'loading') initAll();
  else document.addEventListener('DOMContentLoaded', initAll);

  window.initSphereCard = initOne;
})();
