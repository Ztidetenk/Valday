const letter3d = document.getElementById("letter3d");
const paperFold = document.getElementById("paperFold");
const paperFront = document.getElementById("paperFront");
const titleEl = document.getElementById("titleText");
const bodyEl = document.getElementById("bodyText");
const signatureEl = document.getElementById("signatureText");

const hasGSAP = typeof window.gsap !== "undefined";
const hasSplitText = typeof window.SplitText !== "undefined";
const hasScramble = typeof window.ScrambleTextPlugin !== "undefined";

if (hasGSAP) {
  if (hasSplitText && hasScramble) {
    gsap.registerPlugin(SplitText, ScrambleTextPlugin);
  } else if (hasScramble) {
    gsap.registerPlugin(ScrambleTextPlugin);
  }
}

function animateIntro() {
  if (!hasGSAP) return;

  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (hasSplitText) {
    const titleSplit = new SplitText(titleEl, { type: "chars" });
    const bodySplit = new SplitText(bodyEl.querySelectorAll("p"), { type: "lines" });
    const signatureSplit = new SplitText(signatureEl, { type: "chars" });

    intro
      .set([titleSplit.chars, bodySplit.lines, signatureSplit.chars], { opacity: 0, y: 16 })
      .fromTo(paperFold, { rotateX: 0 }, { rotateX: -178, duration: 1.2, ease: "power4.inOut" })
      .to(paperFront, { rotateX: 0, duration: 1.2, ease: "elastic.out(1, 0.58)" }, "<+0.08")
      .to(
        titleSplit.chars,
        {
          opacity: 1,
          y: 0,
          duration: 0.84,
          ease: "elastic.out(1.1, 0.4)",
          stagger: { from: "center", each: 0.028 }
        },
        "<+0.2"
      )
      .to(bodySplit.lines, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: "back.out(2.2)" }, "<+0.25")
      .to(signatureSplit.chars, { opacity: 1, y: 0, duration: 0.72, ease: "elastic.out(1, 0.45)", stagger: 0.025 }, "<+0.1");

    if (hasScramble) {
      intro.to(
        titleEl,
        {
          duration: 0.95,
          scrambleText: {
            text: titleEl.textContent,
            chars: "✦✧♥•",
            revealDelay: 0.08,
            speed: 0.35
          }
        },
        1.05
      );
    }
  } else {
    intro
      .fromTo(paperFold, { rotateX: 0 }, { rotateX: -178, duration: 1.15, ease: "power4.inOut" })
      .to(paperFront, { rotateX: 0, duration: 1.2, ease: "elastic.out(1, 0.58)" }, "<+0.08")
      .from([titleEl, ...bodyEl.querySelectorAll("p"), signatureEl], {
        opacity: 0,
        y: 14,
        duration: 0.7,
        stagger: 0.12,
        ease: "power2.out"
      });
  }

  intro.fromTo(letter3d, { rotateY: -7, rotateX: 5 }, { rotateY: 0, rotateX: 0, duration: 1.1, ease: "expo.out" }, 0);
}

animateIntro();

if (hasGSAP) {
  gsap.to(".bloom-layer", {
    opacity: 0.36,
    scale: 1.07,
    duration: 3.4,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1
  });

  [paperFront, paperFold].forEach((el, index) => {
    gsap.to(el, {
      x: index % 2 === 0 ? 0.6 : -0.6,
      y: index % 2 === 0 ? -0.35 : 0.35,
      duration: 2.4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });
  });
}

const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;

  if (!hasGSAP) return;

  const rx = gsap.utils.mapRange(0, window.innerHeight, 8, -8, event.clientY);
  const ry = gsap.utils.mapRange(0, window.innerWidth, -10, 10, event.clientX);

  gsap.to(letter3d, {
    rotateX: rx * 0.3,
    rotateY: ry * 0.4,
    duration: 0.7,
    ease: "power3.out"
  });
});

const distortionCanvas = document.getElementById("distortion-canvas");
const dctx = distortionCanvas.getContext("2d");
const bursts = [];

function resizeDistortion() {
  distortionCanvas.width = window.innerWidth;
  distortionCanvas.height = window.innerHeight;
}

function spawnBurst(x, y) {
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 2.2;
    bursts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 4 + Math.random() * 10,
      hue: 325 + Math.random() * 35
    });
  }
}

window.addEventListener("pointermove", (event) => {
  if (Math.random() > 0.7) spawnBurst(event.clientX, event.clientY);
});

function renderDistortion() {
  dctx.clearRect(0, 0, distortionCanvas.width, distortionCanvas.height);

  for (let i = bursts.length - 1; i >= 0; i -= 1) {
    const p = bursts[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.028;
    p.size *= 0.982;

    if (p.life <= 0 || p.size <= 0.3) {
      bursts.splice(i, 1);
      continue;
    }

    const grad = dctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    grad.addColorStop(0, `hsla(${p.hue}, 95%, 74%, ${0.24 * p.life})`);
    grad.addColorStop(1, "hsla(300, 90%, 45%, 0)");

    dctx.globalCompositeOperation = "lighter";
    dctx.fillStyle = grad;
    dctx.beginPath();
    dctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    dctx.fill();
  }

  requestAnimationFrame(renderDistortion);
}

const heartsCanvas = document.getElementById("hearts-canvas");
const hctx = heartsCanvas.getContext("2d");
const hearts = [];

function resizeHearts() {
  heartsCanvas.width = window.innerWidth;
  heartsCanvas.height = window.innerHeight;
}

function addHeart() {
  hearts.push({
    x: Math.random() * heartsCanvas.width,
    y: heartsCanvas.height + 20,
    size: 8 + Math.random() * 14,
    speed: 0.16 + Math.random() * 0.55,
    drift: (Math.random() - 0.5) * 0.45,
    alpha: 0.08 + Math.random() * 0.2,
    pulse: Math.random() * Math.PI * 2
  });
}

for (let i = 0; i < 30; i += 1) addHeart();

function drawHeart(ctx, x, y, size, alpha) {
  const topCurve = size * 0.3;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 30, size / 30);
  ctx.beginPath();
  ctx.moveTo(0, topCurve);
  ctx.bezierCurveTo(0, 0, -15, 0, -15, topCurve);
  ctx.bezierCurveTo(-15, 10, 0, 17, 0, 25);
  ctx.bezierCurveTo(0, 17, 15, 10, 15, topCurve);
  ctx.bezierCurveTo(15, 0, 0, 0, 0, topCurve);
  ctx.closePath();
  ctx.fillStyle = `rgba(255, 133, 181, ${alpha})`;
  ctx.shadowColor = "rgba(255, 145, 201, 0.3)";
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.restore();
}

function renderHearts() {
  hctx.clearRect(0, 0, heartsCanvas.width, heartsCanvas.height);

  hearts.forEach((heart) => {
    heart.y -= heart.speed;
    heart.x += Math.sin(heart.pulse) * heart.drift;
    heart.pulse += 0.02;

    if (heart.y < -40) {
      heart.y = heartsCanvas.height + 30;
      heart.x = Math.random() * heartsCanvas.width;
    }

    const pointerBoost = Math.max(0, 1 - Math.hypot(heart.x - pointer.x, heart.y - pointer.y) / 300);
    drawHeart(hctx, heart.x, heart.y, heart.size * (1 + pointerBoost * 0.12), heart.alpha + pointerBoost * 0.08);
  });

  requestAnimationFrame(renderHearts);
}

window.addEventListener("resize", () => {
  resizeDistortion();
  resizeHearts();
});

resizeDistortion();
resizeHearts();
renderDistortion();
renderHearts();
