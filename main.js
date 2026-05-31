/* ============================================
   STELLA MARTIS — Three.js 3D Space Background
   + Scroll Animations + Navigation
   ============================================ */

(function () {
  'use strict';

  // ── Three.js Scene Setup ──
  const canvas = document.getElementById('space-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050510, 1);

  // ── Star Field ──
  function createStarField(count, spread, sizeMin, sizeMax) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const colorOptions = [
      [1.0, 1.0, 1.0],       // white
      [0.9, 0.92, 1.0],      // cool white
      [1.0, 0.95, 0.85],     // warm white
      [0.7, 0.85, 1.0],      // blue-white
      [1.0, 0.75, 0.5],      // orange
      [0.55, 0.7, 1.0],      // blue
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread;
      positions[i3 + 2] = (Math.random() - 0.5) * spread;

      const c = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i3]     = c[0];
      colors[i3 + 1] = c[1];
      colors[i3 + 2] = c[2];

      sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return { geometry, positions, sizes };
  }

  // Star shader material for twinkling
  const starVertexShader = `
    attribute float size;
    varying vec3 vColor;
    uniform float uTime;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + position.x * 10.0 + position.y * 7.0);
      gl_PointSize = size * twinkle * (200.0 / -mvPosition.z);
      gl_PointSize = clamp(gl_PointSize, 0.5, 8.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const starFragmentShader = `
    varying vec3 vColor;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      alpha *= alpha;
      gl_FragColor = vec4(vColor, alpha);
    }
  `;

  const starUniforms = { uTime: { value: 0 } };

  // Layer 1: Close stars (bright, large)
  const closeStars = createStarField(2000, 400, 1.5, 4.0);
  const closeStarMaterial = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const closeStarPoints = new THREE.Points(closeStars.geometry, closeStarMaterial);
  scene.add(closeStarPoints);

  // Layer 2: Mid stars
  const midStars = createStarField(4000, 800, 0.8, 2.0);
  const midStarMaterial = closeStarMaterial.clone();
  midStarMaterial.uniforms = { uTime: starUniforms.uTime };
  const midStarPoints = new THREE.Points(midStars.geometry, midStarMaterial);
  scene.add(midStarPoints);

  // Layer 3: Far stars (dim, small)
  const farStars = createStarField(6000, 1200, 0.3, 1.0);
  const farStarMaterial = closeStarMaterial.clone();
  farStarMaterial.uniforms = { uTime: starUniforms.uTime };
  const farStarPoints = new THREE.Points(farStars.geometry, farStarMaterial);
  scene.add(farStarPoints);

  // ── Nebula Clouds ──
  function createNebula(x, y, z, color, size) {
    const geo = new THREE.PlaneGeometry(size, size);
    const nebulaCanvas = document.createElement('canvas');
    nebulaCanvas.width = 256;
    nebulaCanvas.height = 256;
    const ctx = nebulaCanvas.getContext('2d');

    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.4, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // Add noise-like variation
    for (let i = 0; i < 200; i++) {
      const nx = Math.random() * 256;
      const ny = Math.random() * 256;
      const nr = Math.random() * 30 + 5;
      const dist = Math.sqrt((nx - 128) ** 2 + (ny - 128) ** 2);
      if (dist < 120) {
        const g2 = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        g2.addColorStop(0, color.replace(')', ', 0.15)').replace('rgb', 'rgba'));
        g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g2;
        ctx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
      }
    }

    const texture = new THREE.CanvasTexture(nebulaCanvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.z = Math.random() * Math.PI;
    return mesh;
  }

  const nebulae = [
    createNebula(-80, 30, -300, 'rgb(232, 112, 64)', 200),
    createNebula(100, -40, -500, 'rgb(74, 125, 212)', 250),
    createNebula(-50, -60, -700, 'rgb(180, 80, 120)', 180),
    createNebula(120, 50, -200, 'rgb(100, 60, 180)', 150),
    createNebula(-100, 20, -900, 'rgb(232, 150, 64)', 220),
  ];
  nebulae.forEach((n) => scene.add(n));

  // ── Mars Planet ──
  function createMarsTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d');

    // Base gradient
    const baseGrad = ctx.createLinearGradient(0, 0, 512, 256);
    baseGrad.addColorStop(0, '#c1440e');
    baseGrad.addColorStop(0.3, '#d4673b');
    baseGrad.addColorStop(0.5, '#b8502a');
    baseGrad.addColorStop(0.7, '#a84520');
    baseGrad.addColorStop(1, '#c76030');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Dark regions
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const rx = Math.random() * 60 + 20;
      const ry = Math.random() * 30 + 10;
      ctx.fillStyle = `rgba(90, 40, 15, ${Math.random() * 0.4 + 0.1})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lighter patches
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const r = Math.random() * 25 + 5;
      ctx.fillStyle = `rgba(220, 160, 100, ${Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Polar caps
    const polarGrad = ctx.createLinearGradient(0, 0, 0, 30);
    polarGrad.addColorStop(0, 'rgba(240, 230, 220, 0.6)');
    polarGrad.addColorStop(1, 'rgba(240, 230, 220, 0)');
    ctx.fillStyle = polarGrad;
    ctx.fillRect(0, 0, 512, 30);

    const polarGrad2 = ctx.createLinearGradient(0, 226, 0, 256);
    polarGrad2.addColorStop(0, 'rgba(240, 230, 220, 0)');
    polarGrad2.addColorStop(1, 'rgba(240, 230, 220, 0.5)');
    ctx.fillStyle = polarGrad2;
    ctx.fillRect(0, 226, 512, 30);

    // Craters
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 512;
      const y = 30 + Math.random() * 196;
      const r = Math.random() * 15 + 5;
      ctx.strokeStyle = `rgba(80, 35, 10, ${Math.random() * 0.5 + 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(150, 80, 40, ${Math.random() * 0.15})`;
      ctx.fill();
    }

    return new THREE.CanvasTexture(c);
  }

  const marsTexture = createMarsTexture();
  const marsGeometry = new THREE.SphereGeometry(20, 64, 64);
  const marsMaterial = new THREE.MeshPhongMaterial({
    map: marsTexture,
    shininess: 5,
    specular: new THREE.Color(0x332211),
  });
  const mars = new THREE.Mesh(marsGeometry, marsMaterial);
  mars.position.set(60, -20, -180);
  scene.add(mars);

  // Mars atmosphere glow
  const glowGeometry = new THREE.SphereGeometry(21.5, 64, 64);
  const glowMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(0.9, 0.45, 0.2, 1.0) * intensity * 0.6;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  const marsGlow = new THREE.Mesh(glowGeometry, glowMaterial);
  marsGlow.position.copy(mars.position);
  scene.add(marsGlow);

  // ── Lighting ──
  const ambientLight = new THREE.AmbientLight(0x222244, 0.4);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff0dd, 1.2);
  sunLight.position.set(100, 50, 50);
  scene.add(sunLight);

  const marsLight = new THREE.PointLight(0xe87040, 0.3, 200);
  marsLight.position.copy(mars.position);
  scene.add(marsLight);

  // ── Shooting Stars ──
  const shootingStars = [];
  function createShootingStar() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      linewidth: 1,
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);

    return {
      line,
      active: false,
      progress: 0,
      speed: 0,
      startPos: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      length: 0,
    };
  }

  for (let i = 0; i < 3; i++) {
    shootingStars.push(createShootingStar());
  }

  function launchShootingStar(star) {
    star.active = true;
    star.progress = 0;
    star.speed = 0.01 + Math.random() * 0.02;
    star.length = 5 + Math.random() * 10;

    star.startPos.set(
      (Math.random() - 0.5) * 200,
      50 + Math.random() * 100,
      camera.position.z - 50 - Math.random() * 100
    );

    star.direction.set(
      (Math.random() - 0.5) * 0.5,
      -1,
      (Math.random() - 0.5) * 0.3
    ).normalize();

    star.line.material.opacity = 0;
  }

  // ── Dust Particles ──
  const dustCount = 500;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSizes = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3]     = (Math.random() - 0.5) * 100;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    dustSizes[i] = Math.random() * 0.5 + 0.2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustGeo.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));
  const dustMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.3,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dustParticles = new THREE.Points(dustGeo, dustMat);
  scene.add(dustParticles);

  // ── Scroll State ──
  let scrollY = 0;
  let targetScrollY = 0;
  let lastScrollY = 0;
  let scrollVelocity = 0;
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY;
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ── Animation Loop ──
  const clock = new THREE.Clock();
  let shootingStarTimer = 0;

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();
    starUniforms.uTime.value = elapsed;

    // Smooth scroll
    scrollY += (targetScrollY - scrollY) * 0.08;
    scrollVelocity = Math.abs(scrollY - lastScrollY);
    lastScrollY = scrollY;

    const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const scrollFraction = scrollY / maxScroll;

    // Camera movement through space
    camera.position.z = -scrollFraction * 120;
    camera.position.x = mouseX * 3;
    camera.position.y = -mouseY * 2;
    camera.rotation.x = mouseY * 0.02;
    camera.rotation.y = -mouseX * 0.02;

    // Star parallax layers
    closeStarPoints.position.z = scrollFraction * 30;
    closeStarPoints.rotation.y = elapsed * 0.01 + scrollFraction * 0.2;

    midStarPoints.position.z = scrollFraction * 15;
    midStarPoints.rotation.y = elapsed * 0.005 + scrollFraction * 0.1;

    farStarPoints.position.z = scrollFraction * 5;
    farStarPoints.rotation.y = elapsed * 0.002 + scrollFraction * 0.05;

    // Mars rotation & orbit
    mars.rotation.y = elapsed * 0.05;
    marsGlow.rotation.y = elapsed * 0.05;

    // Mars parallax — comes closer as you scroll
    const marsZ = -180 + scrollFraction * 60;
    const marsX = 60 - scrollFraction * 20;
    mars.position.z = marsZ;
    mars.position.x = marsX;
    marsGlow.position.copy(mars.position);
    marsLight.position.copy(mars.position);

    // Nebulae gentle drift
    nebulae.forEach((neb, i) => {
      neb.rotation.z += delta * 0.01 * (i % 2 === 0 ? 1 : -1);
      neb.position.y += Math.sin(elapsed * 0.3 + i) * 0.03;
    });

    // Dust follows camera loosely
    dustParticles.position.z = camera.position.z;
    dustParticles.rotation.y = elapsed * 0.02;
    dustParticles.rotation.x = elapsed * 0.01;

    // Shooting stars
    shootingStarTimer += delta;
    if (shootingStarTimer > 3 + Math.random() * 5) {
      shootingStarTimer = 0;
      const inactive = shootingStars.find((s) => !s.active);
      if (inactive) launchShootingStar(inactive);
    }

    shootingStars.forEach((star) => {
      if (!star.active) return;
      star.progress += star.speed;

      const headPos = star.startPos.clone().add(
        star.direction.clone().multiplyScalar(star.progress * 200)
      );
      const tailPos = headPos.clone().sub(
        star.direction.clone().multiplyScalar(star.length)
      );

      const posArr = star.line.geometry.attributes.position.array;
      posArr[0] = tailPos.x; posArr[1] = tailPos.y; posArr[2] = tailPos.z;
      posArr[3] = headPos.x; posArr[4] = headPos.y; posArr[5] = headPos.z;
      star.line.geometry.attributes.position.needsUpdate = true;

      // Fade in and out
      if (star.progress < 0.15) {
        star.line.material.opacity = star.progress / 0.15;
      } else if (star.progress > 0.7) {
        star.line.material.opacity = 1.0 - (star.progress - 0.7) / 0.3;
      } else {
        star.line.material.opacity = 1.0;
      }

      if (star.progress >= 1.0) {
        star.active = false;
        star.line.material.opacity = 0;
      }
    });

    renderer.render(scene, camera);
  }

  animate();

  // ── Resize ──
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Navigation ──
  const nav = document.getElementById('header');
  const navToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('main-nav');
  const navLinksItems = document.querySelectorAll('.main-nav a');

  // Scroll class for header (opacity styling)
  function updateNav() {
    if (nav) {
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Mobile toggle
  if (navToggle && navLinks && nav) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      nav.classList.toggle('menu-open');
    });
  }

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });

        // Close mobile menu
        navToggle?.classList.remove('active');
        navLinks?.classList.remove('active');
        nav?.classList.remove('menu-open');
      }
    });
  });

  // Active section tracking
  const sections = document.querySelectorAll('section[id]');
  function highlightNav() {
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      const link = document.querySelector(`.main-nav a[href="#${id}"]`);
      if (link) {
        if (scrollPos >= top && scrollPos < top + height) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });
  }
  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  // ── Scroll Reveal ──
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  // ── Form Handling ──
  const form = document.querySelector('.agency-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'TRANSMITTING...';
      btn.style.opacity = '0.6';

      setTimeout(() => {
        btn.textContent = 'BRIEF RECEIVED';
        btn.style.backgroundColor = '#2e7d32';
        btn.style.opacity = '1';

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.backgroundColor = '';
          btn.style.opacity = '1';
          form.reset();
        }, 3000);
      }, 1500);
    });
  }

  // ── Preloader ──
  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 600);
    }
  });

})();
