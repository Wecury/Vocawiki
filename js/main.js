/* ============================================================
   Vocawiki 入口导航 — 交互脚本
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 主题切换 ---------- */
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    // 手动切换仅在当前会话生效，不写入 localStorage；刷新后回到浏览器系统偏好
    toggle.addEventListener("click", function () {
      document.documentElement.classList.toggle("dark");
    });
  }

  /* ---------- 滚动显现动画 ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* ---------- 卡片鼠标光晕 ---------- */
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
    });
  });

  /* ---------- 数字滚动 ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var duration = 900;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString("en-US");
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString("en-US");
      }
    }

    if ("IntersectionObserver" in window) {
      var once = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              requestAnimationFrame(step);
              once.unobserve(el);
            }
          });
        },
        { threshold: 0.5 }
      );
      once.observe(el);
    } else {
      el.textContent = target.toLocaleString("en-US");
    }
  }

  document.querySelectorAll("[data-count]").forEach(animateCount);

  /* ---------- 实时站点统计（从 MediaWiki API 拉取，失败时保留默认值） ---------- */
  var statsAPI =
    "https://voca.wiki/api.php?action=query&meta=siteinfo&siprop=statistics&format=json&origin=*";

  fetch(statsAPI)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      var stats = data && data.query && data.query.statistics;
      if (!stats) return;
      var map = {
        edits: stats.edits,
        articles: stats.articles,
        users: stats.users
      };
      document.querySelectorAll("[data-metric]").forEach(function (el) {
        var key = el.getAttribute("data-metric");
        var val = map[key];
        if (typeof val !== "number") return;
        var prev = parseInt(el.getAttribute("data-count"), 10);
        el.setAttribute("data-count", val);
        if (prev !== val) {
          el.textContent = "0";
          animateCount(el);
        }
      });
    })
    .catch(function () {
      /* 网络异常时保留默认数值 */
    });

  /* ---------- 返回顶部 ---------- */
  var backTop = document.getElementById("back-top");
  if (backTop) {
    var onScroll = function () {
      var show = window.scrollY > 480;
      backTop.classList.toggle("show", show);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 在线状态探测（尽力而为，失败静默） ---------- */
  var probes = [
    { el: "js-status-main", url: "https://voca.wiki/", label: "主站" },
    { el: "js-status-test", url: "https://test.voca.wiki/", label: "测试站" }
  ];

  probes.forEach(function (p) {
    var node = document.getElementById(p.el);
    if (!node) return;
    fetch(p.url, { method: "HEAD", mode: "no-cors", cache: "no-store" })
      .then(function () {
        node.textContent = "在线";
        node.classList.add("ok");
      })
      .catch(function () {
        node.textContent = "无法连接";
        node.classList.add("down");
      });
  });
})();
