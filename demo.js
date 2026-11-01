// 陀螺動畫示範：俯視對戰盤的簡化模擬（示意，不是真實物理數據）。
// 用法：<div class="video card" data-demo="F"></div>，demo 名稱見 DEMOS。
(function () {
  const SIZE = 400;
  const C = SIZE / 2;
  const WALL = 182; // 盤邊
  const RAIL = 156; // X 衝刺軌道
  const TOP_R = 19;

  // 盤邊的出口（角度：0 是右邊，順時針為正）
  const POCKETS = [
    { name: "Xtreme 區", at: -Math.PI / 2, half: 0.3, color: "#ff4d6d" },
    { name: "Over 區", at: Math.PI / 2 + 0.95, half: 0.24, color: "#ffb703" },
    { name: "Over 區", at: Math.PI / 2 - 0.95, half: 0.24, color: "#ffb703" },
  ];

  // 軸心的動作特性
  const BITS = {
    F: { name: "平底 F", kind: "攻擊型", color: "#e63946", lobes: 3, drive: 230, damp: 0.35, life: 9, rail: true, hit: 1.6 },
    T: { name: "錐形 T", kind: "平衡型", color: "#f4b400", lobes: 4, drive: 260, damp: 0.6, life: 14, rail: true, hit: 1.2, calmDown: true },
    B: { name: "球形 B", kind: "持久型", color: "#8f5be8", lobes: 2, drive: 45, damp: 0.9, life: 21, rail: false, hit: 0.8 },
    N: { name: "針狀 N", kind: "防禦型", color: "#2a9d48", lobes: 6, drive: 0, damp: 2.4, life: 15, rail: false, hit: 0.9 },
  };

  const KIND_CLASS = { 攻擊型: "t-attack", 平衡型: "t-balance", 持久型: "t-stamina", 防禦型: "t-defense" };

  // ===== 示範內容 =====
  const DEMOS = {
    F: {
      title: "平底軸 F：衝來衝去",
      desc: "攻擊型。平平的底部摩擦大，會沿著盤邊的 X 軌道衝刺，畫出像花瓣的路線。",
      tops: [{ bit: "F", x: 200, y: 110, vx: 150, vy: 70 }],
      captions: [[0.3, "咬住盤邊的齒條，X 衝刺！"], [4, "衝出來、再繞回去，路線像花瓣"], [7.5, "力氣用完得比較快"]],
    },
    T: {
      title: "錐形軸 T：先攻後守",
      desc: "平衡型。一開始會移動、衝刺，轉速變慢之後會回到中間，比較持久。",
      tops: [{ bit: "T", x: 200, y: 115, vx: 120, vy: 60 }],
      captions: [[0.3, "前半段：到處移動"], [6, "後半段：慢慢回到中間"]],
    },
    B: {
      title: "球形軸 B：轉很久",
      desc: "持久型。圓圓的底部移動剛剛好，會在中間附近慢慢繞，可以轉很久。",
      tops: [{ bit: "B", x: 250, y: 150, vx: 70, vy: 40 }],
      captions: [[0.3, "慢慢滑到中間"], [5, "在中間小小地繞圈"], [14, "還在轉！持久型最會撐"]],
    },
    N: {
      title: "針狀軸 N：站在中間",
      desc: "防禦型。尖尖的軸心幾乎不移動，站在中間等對手撞過來。",
      tops: [{ bit: "N", x: 212, y: 190, vx: 30, vy: 10 }],
      captions: [[0.3, "幾乎站在原地不動"], [9, "轉速變慢時開始搖晃"]],
    },
    launch: {
      title: "直立發射 vs 傾斜發射",
      desc: "同一顆攻擊型陀螺，換一種發射方式，動作就不一樣。",
      options: [
        ["flat", "直立發射", { tops: [{ bit: "F", x: 200, y: 195, vx: 25, vy: 10 }], captions: [[0.3, "直立：從中間出發，慢慢才衝起來"]] }],
        ["tilt", "傾斜發射", { tops: [{ bit: "F", x: 200, y: 90, vx: 230, vy: 60 }], captions: [[0.3, "傾斜：馬上衝向盤邊，咬住 X 軌道！"]] }],
      ],
    },
    spin: {
      title: "右旋 vs 左旋",
      desc: "看陀螺的轉動方向：從上面看，右旋是順時針，左旋是逆時針。",
      options: [
        ["right", "右旋 ↻", { tops: [{ bit: "F", x: 200, y: 110, vx: 150, vy: 70, dir: 1 }], captions: [[0.3, "右旋：從上面看是順時針轉"]] }],
        ["left", "左旋 ↺", { tops: [{ bit: "F", x: 200, y: 110, vx: -150, vy: 70, dir: -1 }], captions: [[0.3, "左旋：從上面看是逆時針轉"]] }],
      ],
    },
    spinFinish: {
      title: "旋轉終結（1 分）",
      desc: "持久型對防禦型：兩顆都沒出場，比誰轉得久。",
      tops: [
        { bit: "B", x: 200, y: 110, vx: 90, vy: 30, label: "A" },
        { bit: "N", x: 200, y: 290, vx: -40, vy: -10, label: "B" },
      ],
      captions: [[0.3, "兩顆都在盤子裡互相碰撞"], [8, "防禦型的轉速先掉下來……"]],
    },
    overFinish: {
      title: "出場終結（2 分）",
      desc: "攻擊型對持久型：攻擊型把對手撞進旁邊的 Over 區。",
      tops: [
        { bit: "F", x: 200, y: 105, vx: 190, vy: 80, label: "A" },
        { bit: "B", x: 205, y: 220, vx: 20, vy: 5, label: "B" },
      ],
      knockout: { hit: 2, loser: 1, pocket: 1, by: 4 },
      captions: [[0.3, "攻擊型衝刺，尋找對手"]],
    },
    burstFinish: {
      title: "爆裂終結（2 分）",
      desc: "平衡型對攻擊型：用力撞擊，對手的陀螺被撞散開了！",
      tops: [
        { bit: "T", x: 200, y: 110, vx: 140, vy: 60, label: "A" },
        { bit: "F", x: 200, y: 290, vx: -150, vy: -50, label: "B" },
      ],
      burst: { hit: 1, loser: 1, by: 3 },
      captions: [[0.3, "兩顆都很會移動，激烈對撞"]],
    },
    xtremeFinish: {
      title: "極限終結（3 分）",
      desc: "攻擊型對平衡型：沿著 X 軌道加速衝撞，把對手撞進正前方的 Xtreme 區！",
      tops: [
        { bit: "F", x: 200, y: 100, vx: 210, vy: 90, label: "A" },
        { bit: "T", x: 210, y: 230, vx: -30, vy: 10, label: "B" },
      ],
      knockout: { hit: 1, loser: 1, pocket: 0, by: 3.5 },
      captions: [[0.3, "攻擊型咬住 X 軌道，超加速！"]],
    },
  };

  const FINISH_TEXT = {
    spin: (w) => `🏁 旋轉終結！${w} 轉得比較久，得 1 分`,
    over: (w) => `💥 出場終結！${w} 把對手撞進 Over 區，得 2 分`,
    xtreme: (w) => `⚡ 極限終結！${w} 把對手撞進 Xtreme 區，得 3 分`,
    burst: (w) => `💣 爆裂終結！${w} 把對手撞散了，得 2 分`,
  };

  // ===== 模擬 =====
  function makeTop(spec) {
    const b = BITS[spec.bit];
    return {
      ...spec,
      b,
      dir: spec.dir || 1,
      spin: 1,
      ang: Math.random() * 6,
      state: "spin", // spin / stopped / out / burst
      trail: [],
      rail: null,
      outT: 0,
      wob: Math.random() * 6,
    };
  }

  function pocketAt(angle) {
    return POCKETS.findIndex((p) => Math.abs(normAng(angle - p.at)) < p.half);
  }
  function normAng(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  function step(sim, dt) {
    sim.t += dt;
    const live = sim.tops.filter((t) => t.state === "spin");

    for (const t of sim.tops) {
      if (t.state === "out") {
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.outT += dt;
        continue;
      }
      if (t.state === "burst") continue;

      if (t.state === "spin") {
        t.spin -= dt / t.b.life;
        if (t.spin <= 0) {
          t.spin = 0;
          t.state = "stopped";
        }
      }

      const dx = t.x - C;
      const dy = t.y - C;
      const r = Math.hypot(dx, dy);

      // 在 X 軌道上衝刺
      if (t.rail) {
        t.rail.left -= dt;
        const a = Math.atan2(dy, dx) + (t.rail.w * dt) / RAIL;
        const nearPocket = POCKETS.some((p) => Math.abs(normAng(a - p.at)) < p.half + 0.12);
        if (t.rail.left <= 0 || nearPocket || t.state !== "spin") {
          const tx = -Math.sin(a) * Math.sign(t.rail.w);
          const ty = Math.cos(a) * Math.sign(t.rail.w);
          t.vx = tx * Math.abs(t.rail.w) * 0.6 - Math.cos(a) * 170;
          t.vy = ty * Math.abs(t.rail.w) * 0.6 - Math.sin(a) * 170;
          t.rail = null;
        } else {
          t.x = C + Math.cos(a) * (RAIL + 6);
          t.y = C + Math.sin(a) * (RAIL + 6);
          t.vx = -Math.sin(a) * t.rail.w;
          t.vy = Math.cos(a) * t.rail.w;
        }
        t.ang += t.dir * (4 + 26 * t.spin) * dt;
        pushTrail(t);
        continue;
      }

      // 盤子是碗形：越外面越往中間滑
      let ax = -dx * 1.1;
      let ay = -dy * 1.1;
      const sp = Math.hypot(t.vx, t.vy);
      if (t.state === "spin" && sp > 1) {
        let drive = t.b.drive * t.spin;
        if (t.b.calmDown) drive *= t.spin * t.spin;
        ax += (t.vx / sp) * drive * 0.6;
        ay += (t.vy / sp) * drive * 0.6;
        // 低轉速時的搖晃
        if (t.spin < 0.25) {
          t.wob += dt * 9;
          ax += Math.cos(t.wob) * 60 * (0.25 - t.spin) * 4;
          ay += Math.sin(t.wob) * 60 * (0.25 - t.spin) * 4;
        }
      }
      const damp = t.state === "stopped" ? 5 : t.b.damp;
      t.vx = (t.vx + ax * dt) * Math.exp(-damp * dt);
      t.vy = (t.vy + ay * dt) * Math.exp(-damp * dt);
      t.x += t.vx * dt;
      t.y += t.vy * dt;

      // 碰到 X 軌道就衝刺
      const r2 = Math.hypot(t.x - C, t.y - C);
      if (t.state === "spin" && t.b.rail && t.spin > 0.3 && r2 > RAIL && !t.railCool) {
        const a = Math.atan2(t.y - C, t.x - C);
        if (pocketAt(a) < 0) {
          const tang = (-Math.sin(a) * t.vx + Math.cos(a) * t.vy) >= 0 ? 1 : -1;
          t.rail = { w: tang * (330 + 170 * t.spin), left: 0.45 + 0.35 * t.spin };
          t.railCool = 0.6;
        }
      }
      if (t.railCool) t.railCool = Math.max(0, t.railCool - dt);

      // 盤邊
      if (r2 > WALL - TOP_R) {
        const a = Math.atan2(t.y - C, t.x - C);
        const p = pocketAt(a);
        if (p >= 0 && t.allowOut === p) {
          t.state = "out";
          t.pocket = p;
          t.vx = Math.cos(a) * 160;
          t.vy = Math.sin(a) * 160;
          continue;
        }
        const nx = Math.cos(a);
        const ny = Math.sin(a);
        const vn = t.vx * nx + t.vy * ny;
        if (vn > 0) {
          t.vx -= 1.6 * vn * nx;
          t.vy -= 1.6 * vn * ny;
        }
        t.x = C + nx * (WALL - TOP_R);
        t.y = C + ny * (WALL - TOP_R);
      }

      t.ang += t.dir * (t.state === "spin" ? 4 + 26 * t.spin : 0) * dt;
      pushTrail(t);
    }

    // 對撞
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) collide(sim, live[i], live[j]);
    }

    // 太久沒撞到：讓攻擊方衝向對手
    const ko = sim.scene.knockout || sim.scene.burst;
    if (ko && !sim.finish && sim.t > ko.by && sim.t - (sim.lastHit || 0) > 1.2) {
      const loser = sim.tops[ko.loser];
      const winner = sim.tops[1 - ko.loser];
      if (winner.state === "spin" && loser.state === "spin") {
        winner.rail = null;
        loser.rail = null;
        loser.railCool = 1;
        winner.railCool = 1;
        const dx = loser.x - winner.x;
        const dy = loser.y - winner.y;
        const d = Math.hypot(dx, dy) || 1;
        winner.vx = (dx / d) * 320;
        winner.vy = (dy / d) * 320;
        loser.vx = (-dx / d) * 140;
        loser.vy = (-dy / d) * 140;
        sim.lastHit = sim.t;
      }
    }

    for (const p of sim.pieces) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-2.2 * dt);
      p.vy *= Math.exp(-2.2 * dt);
      p.ang += p.w * dt;
      p.w *= Math.exp(-1.5 * dt);
    }

    judge(sim);
  }

  function pushTrail(t) {
    t.trail.push(t.x, t.y);
    if (t.trail.length > 520) t.trail.splice(0, 2);
  }

  function collide(sim, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d >= TOP_R * 2 || d === 0) return;
    const nx = dx / d;
    const ny = dy / d;
    const overlap = TOP_R * 2 - d;
    a.x -= (nx * overlap) / 2;
    a.y -= (ny * overlap) / 2;
    b.x += (nx * overlap) / 2;
    b.y += (ny * overlap) / 2;

    const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rv > 0 && !a.rail && !b.rail) return;
    a.rail = b.rail = null;

    const imp = -1.9 * rv / 2;
    const kickA = 70 * b.b.hit * b.spin;
    const kickB = 70 * a.b.hit * a.spin;
    a.vx -= nx * (imp + kickA);
    a.vy -= ny * (imp + kickA);
    b.vx += nx * (imp + kickB);
    b.vy += ny * (imp + kickB);
    a.spin = Math.max(0, a.spin - 0.035 * b.b.hit);
    b.spin = Math.max(0, b.spin - 0.035 * a.b.hit);

    sim.hits++;
    sim.lastHit = sim.t;
    sim.flash.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: 0 });

    const ko = sim.scene.knockout;
    if (ko && sim.hits >= ko.hit && !sim.finish) {
      const loser = sim.tops[ko.loser];
      const p = POCKETS[ko.pocket];
      const tx = C + Math.cos(p.at) * WALL;
      const ty = C + Math.sin(p.at) * WALL;
      const ddx = tx - loser.x;
      const ddy = ty - loser.y;
      const dd = Math.hypot(ddx, ddy) || 1;
      loser.vx = (ddx / dd) * 520;
      loser.vy = (ddy / dd) * 520;
      loser.allowOut = ko.pocket;
      loser.rail = null;
      loser.railCool = 5;
    }
    const bu = sim.scene.burst;
    if (bu && sim.hits >= bu.hit && !sim.finish) {
      const loser = sim.tops[bu.loser];
      loser.state = "burst";
      const parts = [
        { kind: "blade", r: TOP_R },
        { kind: "ratchet", r: TOP_R * 0.62 },
        { kind: "bit", r: TOP_R * 0.32 },
      ];
      parts.forEach((pt, k) => {
        const ang = Math.atan2(loser.y - C, loser.x - C) + (k - 1) * 1.3 + Math.random() * 0.4;
        sim.pieces.push({ ...pt, x: loser.x, y: loser.y, vx: Math.cos(ang) * (190 - k * 40), vy: Math.sin(ang) * (190 - k * 40), ang: loser.ang, w: 14, b: loser.b });
      });
      sim.finish = { type: "burst", winner: 1 - bu.loser };
    }
  }

  function judge(sim) {
    const tops = sim.tops;
    if (!sim.finish) {
      const out = tops.findIndex((t) => t.state === "out");
      if (out >= 0) {
        sim.finish = { type: tops[out].pocket === 0 ? "xtreme" : "over", winner: tops.length > 1 ? 1 - out : -1 };
      } else if (tops.length > 1) {
        const stopped = tops.findIndex((t) => t.state === "stopped");
        if (stopped >= 0) sim.finish = { type: "spin", winner: 1 - stopped };
      }
    }
    if (sim.finish && sim.endAt == null) sim.endAt = sim.t + (tops.length > 1 ? 1.8 : 0);
    if (tops.length === 1 && tops[0].state === "stopped" && sim.endAt == null) {
      sim.endAt = sim.t + 1;
      sim.single = true;
    }
  }

  // ===== 畫面 =====
  function drawStadium(ctx) {
    const g = ctx.createRadialGradient(C, C, 10, C, C, WALL + 10);
    g.addColorStop(0, "#2d4f8f");
    g.addColorStop(0.75, "#1b3566");
    g.addColorStop(1, "#0f2148");
    ctx.fillStyle = "#0b1834";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.beginPath();
    ctx.arc(C, C, WALL + 8, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // 碗形的同心圓
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    for (let r = 40; r < RAIL; r += 36) {
      ctx.beginPath();
      ctx.arc(C, C, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // X 軌道（齒條）
    ctx.save();
    ctx.lineWidth = 2;
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      if (POCKETS.some((p) => Math.abs(normAng(a - p.at)) < p.half + 0.05)) continue;
      ctx.strokeStyle = i % 2 ? "rgba(140,200,255,0.55)" : "rgba(140,200,255,0.25)";
      ctx.beginPath();
      ctx.moveTo(C + Math.cos(a) * (RAIL + 2), C + Math.sin(a) * (RAIL + 2));
      ctx.lineTo(C + Math.cos(a) * (RAIL + 12), C + Math.sin(a) * (RAIL + 12));
      ctx.stroke();
    }
    ctx.restore();

    // 盤邊和出口
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#d9e4f5";
    ctx.beginPath();
    ctx.arc(C, C, WALL + 6, 0, Math.PI * 2);
    ctx.stroke();
    for (const p of POCKETS) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(C, C, WALL + 6, p.at - p.half, p.at + p.half);
      ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.font = "bold 13px 'Noto Sans TC', sans-serif";
      ctx.textAlign = "center";
      const lx = C + Math.cos(p.at) * (WALL - 20);
      const ly = C + Math.sin(p.at) * (WALL - 20);
      ctx.fillText(p.name, lx, ly + 4);
    }
    ctx.fillStyle = "rgba(140,200,255,0.8)";
    ctx.font = "bold 12px 'Noto Sans TC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("X 衝刺軌道", C, C + RAIL - 18);
  }

  function drawTrail(ctx, t) {
    const n = t.trail.length / 2;
    if (n < 2) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for (let i = 1; i < n; i++) {
      ctx.strokeStyle = hexA(t.b.color, (i / n) * 0.7);
      ctx.beginPath();
      ctx.moveTo(t.trail[(i - 1) * 2], t.trail[(i - 1) * 2 + 1]);
      ctx.lineTo(t.trail[i * 2], t.trail[i * 2 + 1]);
      ctx.stroke();
    }
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
  }

  function drawBlade(ctx, b, r, ang) {
    ctx.save();
    ctx.rotate(ang);
    ctx.beginPath();
    const n = b.lobes;
    for (let i = 0; i <= n * 12; i++) {
      const a = (i / (n * 12)) * Math.PI * 2;
      const k = (i % 12) / 12;
      const rr = r * (0.78 + 0.22 * Math.max(0, 1 - Math.abs(k - 0.25) * 4));
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 中心
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = "#e8eef8";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.42, 0);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawTop(ctx, t) {
    if (t.state === "burst") return;
    let alpha = 1;
    if (t.state === "out") alpha = Math.max(0, 1 - t.outT * 1.6);
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(t.x, t.y);
    // 影子
    ctx.beginPath();
    ctx.ellipse(3, 5, TOP_R, TOP_R * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();
    if (t.state === "stopped") {
      ctx.scale(1, 0.7);
      ctx.rotate(0.4);
    } else if (t.spin < 0.25) {
      const w = (0.25 - t.spin) * 10;
      ctx.translate(Math.cos(t.wob) * w, Math.sin(t.wob) * w);
    }
    // 高速轉動的光圈
    if (t.state === "spin" && t.spin > 0.2) {
      ctx.beginPath();
      ctx.arc(0, 0, TOP_R + 3, 0, Math.PI * 2);
      ctx.strokeStyle = hexA("#ffffff", 0.25 * t.spin);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    drawBlade(ctx, t.b, TOP_R, t.ang);
    // 旋轉方向箭頭
    if (t.state === "spin" && t.showDir) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const s = t.dir > 0 ? -0.6 : 0.6 + Math.PI;
      ctx.arc(0, 0, TOP_R + 9, s, s + (t.dir > 0 ? 1.5 : -1.5), t.dir < 0);
      ctx.stroke();
      const e = s + (t.dir > 0 ? 1.5 : -1.5);
      const ex = Math.cos(e) * (TOP_R + 9);
      const ey = Math.sin(e) * (TOP_R + 9);
      const tx = -Math.sin(e) * t.dir;
      const ty = Math.cos(e) * t.dir;
      ctx.beginPath();
      ctx.moveTo(ex + tx * 7, ey + ty * 7);
      ctx.lineTo(ex - ty * 5 - tx * 2, ey + tx * 5 - ty * 2);
      ctx.lineTo(ex + ty * 5 - tx * 2, ey - tx * 5 - ty * 2);
      ctx.closePath();
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
    ctx.restore();
    if (t.label && t.state !== "out") {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px 'Noto Sans TC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(t.label, t.x, t.y - TOP_R - 6);
    }
  }

  function drawPieces(ctx, sim) {
    for (const p of sim.pieces) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ang);
      if (p.kind === "blade") {
        drawBlade(ctx, p.b, p.r, 0);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.kind === "ratchet" ? "#9aa5b8" : "#e8eef8";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawHud(ctx, sim) {
    ctx.textAlign = "left";
    ctx.font = "bold 13px 'Noto Sans TC', sans-serif";
    sim.tops.forEach((t, i) => {
      const y = 14 + i * 22;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(8, y - 2, 150, 18);
      ctx.fillStyle = t.b.color;
      ctx.fillRect(56, y + 3, 96 * Math.max(0, t.state === "out" || t.state === "burst" ? 0 : t.spin), 8);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.strokeRect(56, y + 3, 96, 8);
      ctx.fillStyle = "#fff";
      ctx.fillText(`${t.label ? t.label + " " : ""}轉速`, 12, y + 12);
    });
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(`⏱ ${sim.t.toFixed(1)}`, SIZE - 10, 20);

    for (const f of sim.flash) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, 8 + f.t * 60, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,240,150,${Math.max(0, 1 - f.t * 3)})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  function drawCountdown(ctx, sim, text) {
    for (const t of sim.tops) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.translate(t.x, t.y);
      drawBlade(ctx, t.b, TOP_R, t.ang);
      ctx.restore();
      // 發射器
      ctx.fillStyle = "rgba(230,236,248,0.9)";
      ctx.fillRect(t.x - 30, t.y - 34, 60, 10);
      ctx.fillRect(t.x + 24, t.y - 34, 30, 6);
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `900 ${text.length > 2 ? 40 : 90}px 'Noto Sans TC', sans-serif`;
    ctx.fillText(text, C, C + (text.length > 2 ? 14 : 32));
  }

  // ===== 播放器 =====
  function mount(el) {
    const key = el.dataset.demo;
    const def = DEMOS[key];
    if (!def) return;
    let current = def.options ? def.options[0] : null;
    const kinds = [...new Set((def.tops || []).map((t) => BITS[t.bit].kind))];

    el.innerHTML = `
      <div class="screen">
        <canvas width="${SIZE}" height="${SIZE}" aria-label="${def.title} 動畫"></canvas>
        <button class="play-big" type="button" aria-label="播放">▶</button>
        <div class="caption"></div>
      </div>
      <h3>${def.title}</h3>
      <p class="desc">${def.desc}</p>
      <div class="controls">
        ${def.options ? def.options.map(([id, name], i) => `<button class="btn opt ${i === 0 ? "blue" : ""}" data-opt="${id}" type="button">${name}</button>`).join("") : ""}
        <button class="btn primary play" type="button">▶ 播放</button>
        <button class="btn speed" type="button">🐢 1 倍速</button>
        <label><input type="checkbox" class="trail" checked> 路線</label>
      </div>
      <p class="result"></p>
      ${kinds.length ? `<p class="desc">${(def.tops || []).map((t) => `<span class="tag ${KIND_CLASS[BITS[t.bit].kind]}">${t.label ? t.label + "：" : ""}${BITS[t.bit].kind}・${BITS[t.bit].name}</span>`).join(" ")}</p>` : ""}`;

    const canvas = el.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const caption = el.querySelector(".caption");
    const result = el.querySelector(".result");
    const playBtn = el.querySelector(".play");
    const bigBtn = el.querySelector(".play-big");
    const speedBtn = el.querySelector(".speed");
    const trailBox = el.querySelector(".trail");
    let speed = 1;
    let sim = null;
    let raf = 0;
    let last = 0;
    let running = false;

    function scene() {
      return current ? { ...def, ...current[2] } : def;
    }

    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || SIZE;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
      ctx.setTransform((w * dpr) / SIZE, 0, 0, (w * dpr) / SIZE, 0, 0);
    }

    function reset() {
      const sc = scene();
      sim = {
        scene: sc,
        t: -2.4,
        hits: 0,
        flash: [],
        pieces: [],
        tops: sc.tops.map((s) => {
          const t = makeTop(s);
          t.showDir = key === "spin";
          return t;
        }),
        capIdx: -1,
      };
      caption.textContent = "";
      result.textContent = "";
      render();
    }

    function render() {
      ctx.clearRect(0, 0, SIZE, SIZE);
      drawStadium(ctx);
      if (sim.t < 0) {
        const n = Math.ceil(-sim.t / 0.8);
        drawCountdown(ctx, sim, sim.t < -0.05 ? String(n) : "");
        if (!running) {
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(0, 0, SIZE, SIZE);
        }
        return;
      }
      if (trailBox.checked) sim.tops.forEach((t) => drawTrail(ctx, t));
      sim.tops.forEach((t) => drawTop(ctx, t));
      drawPieces(ctx, sim);
      drawHud(ctx, sim);
      if (sim.t < 0.7) {
        ctx.fillStyle = `rgba(255,255,255,${1 - sim.t / 0.7})`;
        ctx.textAlign = "center";
        ctx.font = "900 40px 'Noto Sans TC', sans-serif";
        ctx.fillText("Go Shoot！", C, C + 14);
      }
    }

    function tick(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000) * speed;
      last = now;
      let left = dt;
      while (left > 0) {
        const h = Math.min(1 / 120, left);
        if (sim.t < 0) sim.t += h;
        else step(sim, h);
        left -= h;
      }
      sim.flash = sim.flash.filter((f) => (f.t += dt) < 0.4);

      const caps = sim.scene.captions || [];
      let ci = -1;
      caps.forEach((c, i) => {
        if (sim.t >= c[0]) ci = i;
      });
      if (sim.t < 0) caption.textContent = "3、2、1，Go Shoot！";
      else if (ci !== sim.capIdx) {
        sim.capIdx = ci;
        caption.textContent = ci >= 0 ? caps[ci][1] : "";
      }

      if (sim.finish && !sim.reported) {
        sim.reported = true;
        const w = sim.finish.winner >= 0 ? sim.tops[sim.finish.winner] : null;
        const text = FINISH_TEXT[sim.finish.type](w ? `${w.label}（${w.b.kind}）` : "");
        caption.textContent = text;
        result.textContent = text;
      }
      if (sim.single && !sim.reported) {
        sim.reported = true;
        caption.textContent = `停下來了！這次轉了大約 ${sim.t.toFixed(1)} 格時間`;
        result.textContent = `⏱ ${sim.tops[0].b.kind}（${sim.tops[0].b.name}）這次轉了 ${sim.t.toFixed(1)} 格時間（動畫示意，不是真實秒數）`;
      }

      render();
      if (sim.endAt != null && sim.t >= sim.endAt) {
        stop(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    function play() {
      if (running) {
        stop(false);
        return;
      }
      if (!sim || sim.endAt != null) reset();
      running = true;
      bigBtn.hidden = true;
      playBtn.textContent = "⏸ 暫停";
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function stop(ended) {
      running = false;
      cancelAnimationFrame(raf);
      playBtn.textContent = ended ? "↻ 再看一次" : "▶ 繼續";
    }

    playBtn.onclick = play;
    bigBtn.onclick = play;
    speedBtn.onclick = () => {
      speed = speed === 1 ? 2 : 1;
      speedBtn.textContent = speed === 1 ? "🐢 1 倍速" : "🐇 2 倍速";
    };
    trailBox.onchange = () => sim && !running && render();
    el.querySelectorAll(".opt").forEach((btn) => {
      btn.onclick = () => {
        current = def.options.find((o) => o[0] === btn.dataset.opt);
        el.querySelectorAll(".opt").forEach((x) => x.classList.toggle("blue", x === btn));
        stop(false);
        reset();
        play();
      };
    });

    fit();
    reset();
    window.addEventListener("resize", () => {
      fit();
      render();
    });
  }

  document.querySelectorAll("[data-demo]").forEach(mount);
  window.BEY_DEMOS = DEMOS;
  window.BEY_SIM = { makeTop, step };
})();
