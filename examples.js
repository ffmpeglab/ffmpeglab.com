/**
 * FFmpegLab Render Code Window
 * Single embeddable script — no dependencies.
 * Renders a tabbed code window (render.ts / render.sql / render.yml / render.sh)
 * and lets the user switch examples by clicking the filename tabs.
 * Includes a copy button to copy the currently visible code.
 * Usage: <script src="/examples.js"></script>
 */
(function () {
  "use strict";

  var CONTAINER_ID = "fflab-render-code-window";
  var STYLE_ID = "fflab-render-code-window-style";

  var FILES = [
    { name: "render.yml", lang: "yml", active: true },
    { name: "render.ts", lang: "ts", active: false },
    { name: "render.sql", lang: "sql", active: false },
    { name: "render.sh", lang: "sh", active: false },
  ];

  var CODE = {
    yml: `# Video Transcoding Pipeline
name: "Video Transcoding Pipeline"
pipelineId: "video-transcode"
runId:
  mode: "deterministic"
  template: "{baseFilename}"
description: "Generate thumbnails and transcoded videos"
version: "1.0.0"

storage:
  output_bucket: "processed"
  buckets:
    - name: "uploads"
      public: false
      allowed_mime_types: ["video/mp4"]
    - name: "processed"
      public: true
      allowed_mime_types: ["image/jpeg", "video/mp4"]

  rls_policies:
    - name: "Users can upload to their own folder"
      operation: "INSERT"
      role: "authenticated"
      condition: |
        bucket_id = 'uploads' AND
        (storage.foldername(name))[1] = auth.uid()::text

steps:
  - id: "thumbnail"
    trigger:
      name: "handle_thumbnail"
      event: "INSERT"
      table: "storage.objects"
      condition: |
        NEW.bucket_id = 'uploads'
    command: -i $MEDIA_1 -vf thumbnail,scale=320:180 -frames:v 1 -y $OUTPUT_PATH
    inputs: ["INPUT_FILE"]
    outputs: ["OUTPUT_FILE"]
    output_path: "{{userId}}/thumbnails/{{baseFilename}}.jpg"
    editor:
      output: "jpg"
      preset: "fast"
      selectedCode: "custom"
    keep: true

  - id: "transcode_720p"
    trigger:
      name: "handle_transcode"
      event: "INSERT"
      table: "storage.objects"
      condition: |
        NEW.bucket_id = 'uploads'
    command: -i $MEDIA_1 -vf scale=-2:720 -movflags +faststart -y $OUTPUT_PATH
    inputs: ["INPUT_FILE"]
    outputs: ["OUTPUT_FILE"]
    output_path: "{{userId}}/videos/{{baseFilename}}.mp4"
    editor:
      output: "mp4"
      preset: "medium"
      selectedCode: "custom"
    keep: true

render:
  project_name: "video-transcode"
  status: "queued"
  public: false`,

    ts: [
      'import * as ffmpeglab from \'ffmpeglab-sdk\';',
      '',
      'const mediaUrl = \'https://www.ffmpeglab.com/media/zoompan.mp4\'',
      'const clientConfig = new ffmpeglab.Configuration({',
      '  accessToken: \'API_KEY\',',
      '  basePath: \'https://api.ffmpeglab.com\',',
      '});',
      '',
      'const client = new ffmpeglab.RendersApi(clientConfig);',
      '',
      'client.rendersControllerCreate({renderDto:{',
      '  project: { ',
      '      id: \'myproject\',',
      '      title: \'myproject\',',
      '      editor: {',
      '        code: \'-i $MEDIA_1 -movflags +faststart -y $OUTPUT_PATH\',',
      '        selectedCode: \'custom\'',
      '      }',
      '  },',
      '  layers: [',
      '     {',
      '      id: \'layer1\',',
      '      media: [',
      '        {',
      '          id: \'media1\',',
      '          url: mediaUrl,',
      '          folderId: "myfolder",',
      '          filename: "zoompan.mp4",',
      '          encoding: {}',
      '         }',
      '      ],',
      '      "editor":{}',
      '    }',
      '  ]',
      '}})',
      '.then((render)=>client.rendersControllerRunRender({',
      '  runDto:{',
      '    id:render.id',
      '  }',
      '}))',
    ].join("\n"),

    sql: [
      '-- ============================================================',
      '-- Step 1: Create the render',
      '-- ============================================================',
      'WITH new_render AS (',
      '  INSERT INTO "render" (',
      '    id, title, project, status, public, user_id, progress, logs, data, result',
      '  )',
      '  VALUES (',
      '    gen_random_uuid(),',
      "    'myproject',",
      "    'myproject',",
      "    'queued',",
      '    false,',
      "    '550e8400-e29b-41d4-a716-446655440000',",
      '    0,',
      "    '',",
      "    '{",
      '      "project": {',
      '        "id": "myproject",',
      '        "title": "myproject",',
      '        "editor": {',
      '          "code": "-i $MEDIA_1 -movflags +faststart -y $OUTPUT_PATH",',
      '          "selectedCode": "custom"',
      '        }',
      '      },',
      '      "layers": [',
      '        {',
      '          "id": "layer1",',
      '          "editor": {},',
      '          "media": [',
      '            {',
      '              "id": "media1",',
      '              "url": "https://www.ffmpeglab.com/media/zoompan.mp4",',
      '              "folderId": "myfolder",',
      '              "filename": "zoompan.mp4",',
      '              "encoding": {}',
      '            }',
      '          ]',
      '        }',
      '      ]',
      "    }',",
      "    '{}'",
      '  )',
      '  RETURNING id',
      ')',
      '-- Store the render ID for later use',
      'SELECT id INTO TEMP render_id FROM new_render;',
      '',
      '-- ============================================================',
      '-- Step 2: Push the job to pgmq',
      '-- ============================================================',
      'SELECT pgmq.send(',
      "  cast('render' as TEXT),",
      "  cast('{\"jobName\":\"render\",\"data\":{\"userId\":\"550e8400-e29b-41d4-a716-446655440000\",\"renderId\": \"' || (SELECT id FROM render_id) || '\"}}' as JSONB),",
      "  cast('{\"messageId\":\"'||gen_random_uuid()||'\"}' as JSONB)",
      ');',
    ].join("\n"),

    sh: [
      'RENDER=$(curl -X POST ${API_HOST}/renders \\',
      '  -H "Authorization: Bearer ${API_KEY}" \\',
      '  -H "Content-Type: application/json" \\',
      "  -d '{",
      '    "project": {',
      '      "id": "myproject",',
      '      "title": "myproject",',
      '      "editor": {',
      '        "code": "-i $MEDIA_1 -movflags +faststart -y $OUTPUT_PATH",',
      '        "selectedCode": "custom"',
      '      }',
      '    },',
      '    "layers": [',
      '      {',
      '        "id": "layer1",',
      '        "media": [',
      '          {',
      '            "id": "media1",',
      '            "url": "https://www.ffmpeglab.com/media/zoompan.mp4",',
      '            "folderId":"myfolder",',
      '            "filename":"zoompan.mp4",',
      '            "encoding":{}',
      '          }',
      '        ],',
      '        "editor":{}',
      '      }',
      '    ]',
      "  }')",
      'RENDER_ID=$(echo "${RENDER}" | grep -o \'"id":"[^"]*"\' | head -1 | sed \'s/"id":"\\(.*\\)"/\\1/\')',
      'echo "RENDER_ID: ${RENDER_ID}"',
      'RUN=$(curl -X PUT $API_HOST/renders/run \\',
      '  -H "Authorization: Bearer ${API_KEY}" \\',
      '  -H "Content-Type: application/json" \\',
      '  -d "{\\"id\\": \\"$RENDER_ID\\"}")',
      'curl -X GET $API_HOST/renders/${RENDER_ID} \\',
      '  -H "Authorization: Bearer ${API_KEY}" \\',
      '  -H "Content-Type: application/json"',
      "echo '\\\\n'",
      'sleep 3',
      'curl -X GET $API_HOST/renders/${RENDER_ID} \\',
      '  -H "Authorization: Bearer ${API_KEY}" \\',
      '  -H "Content-Type: application/json"',
    ].join("\n"),
  };

  // -------- Safe Highlighter --------
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function wrapSpan(content, className) {
    return '<span class="' + className + '">' + escapeHtml(content) + '</span>';
  }

  // Apply a list of rules to a line.
  // Each rule: { regex: RegExp, className: string }
  function applyRules(line, rules) {
    var matches = [];
    rules.forEach(function (rule) {
      var regex = rule.regex;
      // Ensure the regex is global so we can find all matches.
      var flags = regex.flags || '';
      if (!flags.includes('g')) {
        flags += 'g';
      }
      var globalRegex = new RegExp(regex.source, flags);
      var match;
      while ((match = globalRegex.exec(line)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          className: rule.className,
        });
      }
    });
    // Sort matches by start index, then by end index (longer matches first to avoid overlap issues).
    matches.sort(function (a, b) {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });
    // Build the result by iterating over the line and inserting spans.
    var result = '';
    var lastIndex = 0;
    var used = [];
    matches.forEach(function (match) {
      // Check if this match overlaps with any already used match.
      var overlap = used.some(function (usedMatch) {
        return (match.start < usedMatch.end && match.end > usedMatch.start);
      });
      if (overlap) return;
      // Add the text before the match.
      result += escapeHtml(line.substring(lastIndex, match.start));
      // Add the matched text with span.
      result += wrapSpan(match.text, match.className);
      lastIndex = match.end;
      used.push(match);
    });
    // Add the remaining text.
    result += escapeHtml(line.substring(lastIndex));
    return result;
  }

  function highlightYaml(code) {
    var lines = code.split("\n");
    var html = [];
    var rules = [
      { regex: /(#.*)/, className: 'syn-cmt' },
      { regex: /"([^"]*)"/, className: 'syn-str' },
      { regex: /'([^']*)'/, className: 'syn-str' },
      { regex: /\b(true|false|null)\b/, className: 'syn-bool' },
      { regex: /\b(\d+)\b/, className: 'syn-num' },
      { regex: /(\|)/, className: 'syn-op' },
      // Keys: word followed by colon (but not in a string)
      { regex: /^\s*([a-zA-Z_][a-zA-Z0-9_\-]*)(:)/, className: 'syn-key' },
    ];
    lines.forEach(function (line) {
      html.push(applyRules(line, rules));
    });
    return html.join("\n");
  }

  function highlightTs(code) {
    var lines = code.split("\n");
    var html = [];
    var keywords = ['import', 'from', 'const', 'let', 'var', 'new', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'class', 'interface', 'extends', 'implements', 'public', 'private', 'protected', 'static', 'readonly', 'abstract', 'async', 'await', 'of', 'in', 'typeof', 'instanceof', 'void', 'never', 'any', 'unknown', 'this', 'super', 'true', 'false', 'null', 'undefined', 'NaN', 'Infinity'];
    var rules = [
      { regex: /(\/\/.*)/, className: 'syn-cmt' },
      { regex: /"([^"]*)"/, className: 'syn-str' },
      { regex: /'([^']*)'/, className: 'syn-str' },
      { regex: /`([^`]*)`/, className: 'syn-str' },
      { regex: new RegExp('\\b(' + keywords.join('|') + ')\\b', 'g'), className: 'syn-kw' },
      { regex: /\b(\d+)\b/, className: 'syn-num' },
      { regex: /\b([a-zA-Z_]\w*)\s*\(/g, className: 'syn-fn' },
      { regex: /\$\{([^}]*)\}/g, className: 'syn-var' },
    ];
    lines.forEach(function (line) {
      html.push(applyRules(line, rules));
    });
    return html.join("\n");
  }

  function highlightSql(code) {
    var lines = code.split("\n");
    var html = [];
    var keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'JOIN', 'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'IS', 'NULL', 'TRUE', 'FALSE', 'WITH', 'RETURNING', 'VALUES', 'TEMP', 'CAST', 'AS', 'TEXT', 'JSONB', 'UUID', 'gen_random_uuid', 'pgmq', 'send', 'id', 'title', 'project', 'status', 'public', 'user_id', 'progress', 'logs', 'data', 'result'];
    var rules = [
      { regex: /(--.*)/, className: 'syn-cmt' },
      { regex: /'([^']*)'/, className: 'syn-str' },
      { regex: /"([^"]*)"/, className: 'syn-ident' },
      { regex: new RegExp('\\b(' + keywords.join('|') + ')\\b', 'gi'), className: 'syn-kw' },
      { regex: /\b(\d+)\b/, className: 'syn-num' },
      { regex: /\b([a-zA-Z_]\w*)\s*\(/g, className: 'syn-fn' },
    ];
    lines.forEach(function (line) {
      html.push(applyRules(line, rules));
    });
    return html.join("\n");
  }

  function highlightSh(code) {
    var lines = code.split("\n");
    var html = [];
    var keywords = ['echo', 'curl', 'grep', 'sed', 'head', 'sleep', 'export', 'if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'local', 'readonly', 'true', 'false', 'return', 'break', 'continue', 'shift', 'set', 'unset'];
    var rules = [
      { regex: /(#.*)/, className: 'syn-cmt' },
      { regex: /\$([A-Za-z_][A-Za-z0-9_]*)/g, className: 'syn-var' },
      { regex: /\$\{([^}]*)\}/g, className: 'syn-var' },
      { regex: /"([^"]*)"/, className: 'syn-str' },
      { regex: /'([^']*)'/, className: 'syn-str' },
      { regex: new RegExp('\\b(' + keywords.join('|') + ')\\b', 'g'), className: 'syn-kw' },
      { regex: /\b(\d+)\b/, className: 'syn-num' },
    ];
    lines.forEach(function (line) {
      html.push(applyRules(line, rules));
    });
    return html.join("\n");
  }

  var highlighters = {
    yml: highlightYaml,
    ts: highlightTs,
    sql: highlightSql,
    sh: highlightSh,
  };

  function highlightCode(code, lang) {
    var hl = highlighters[lang] || highlightYaml;
    return hl(code);
  }

  // -------- Styles with syntax colors --------
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "#" + CONTAINER_ID + "{max-width:900px;margin-inline:auto;}",

      /* code-window shell */
      "#" + CONTAINER_ID + " .code-window{",
        "overflow:hidden;border-radius:0.75rem;",
        "border:1px solid #2C2741;background:#15121F;",
        "box-shadow:0 20px 40px -16px rgba(0,0,0,0.4);",
      "}",

      /* titlebar */
      "#" + CONTAINER_ID + " .titlebar{",
        "display:flex;align-items:center;gap:0.5rem;",
        "border-bottom:1px solid #2C2741;padding:0.7rem 1rem;",
        "background:#15121F;",
      "}",

      /* dots */
      "#" + CONTAINER_ID + " .dot{height:0.7rem;width:0.7rem;border-radius:9999px;flex:0 0 auto;}",
      "#" + CONTAINER_ID + " .dot.r{background:#FF5F56;}",
      "#" + CONTAINER_ID + " .dot.y{background:#FFBD2E;}",
      "#" + CONTAINER_ID + " .dot.g{background:#27C93F;}",

      /* filename tabs */
      "#" + CONTAINER_ID + " .fname{",
        "margin-left:0.4rem;",
        "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;",
        "font-size:0.72rem;color:#6F6A87;",
        "background:transparent;border:none;cursor:pointer;",
        "padding:0.25rem 0.5rem;border-radius:0.3rem;",
        "transition:color .15s ease,background .15s ease;",
      "}",
      "#" + CONTAINER_ID + " .fname:first-of-type{margin-left:0.75rem;}",
      "#" + CONTAINER_ID + " .fname:hover{color:#D6D2E6;}",
      "#" + CONTAINER_ID + " .fname.active{",
        "color:#fff;background:#221E33;",
      "}",

      /* copy button */
      "#" + CONTAINER_ID + " .copy-btn{",
        "margin-left:auto;",
        "background:transparent;border:none;",
        "color:#6F6A87;cursor:pointer;",
        "padding:0.25rem 0.5rem;border-radius:0.3rem;",
        "font-size:0.9rem;",
        "transition:color .15s ease,background .15s ease;",
      "}",
      "#" + CONTAINER_ID + " .copy-btn:hover{",
        "color:#D6D2E6;background:#221E33;",
      "}",
      "#" + CONTAINER_ID + " .copy-btn.copied{",
        "color:#27C93F;",
      "}",

      /* code body */
      "#" + CONTAINER_ID + " pre.em-code{",
        "overflow-x:auto;padding:1.1rem 1.25rem;margin:0;",
        "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;",
        "font-size:0.82rem;line-height:1.7;color:#D6D2E6;",
        "white-space:pre;",
      "}",

      /* Syntax highlighting colors */
      "#" + CONTAINER_ID + " .syn-cmt{color:#6A6A8A;font-style:italic;}",
      "#" + CONTAINER_ID + " .syn-str{color:#E6C07B;}",
      "#" + CONTAINER_ID + " .syn-kw{color:#C678DD;}",
      "#" + CONTAINER_ID + " .syn-key{color:#E06C75;}",
      "#" + CONTAINER_ID + " .syn-bool{color:#56B6C2;}",
      "#" + CONTAINER_ID + " .syn-num{color:#D19A66;}",
      "#" + CONTAINER_ID + " .syn-op{color:#56B6C2;}",
      "#" + CONTAINER_ID + " .syn-fn{color:#61AFEF;}",
      "#" + CONTAINER_ID + " .syn-var{color:#E06C75;}",
      "#" + CONTAINER_ID + " .syn-ident{color:#98C379;}",
    ].join("");
    document.head.appendChild(style);
  }

  function buildWindow() {
    var container = document.createElement("div");
    container.id = CONTAINER_ID;

    var dots =
      '<span class="dot r"></span>' +
      '<span class="dot y"></span>' +
      '<span class="dot g"></span>';

    var tabs = FILES.map(function (f) {
      return (
        '<button class="mono fname' + (f.active ? " active" : "") + '" data-lang="' + f.lang + '">' +
        f.name +
        "</button>"
      );
    }).join("");

    var copyBtn = '<button class="copy-btn" title="Copy code">📋</button>';

    var titlebar =
      '<div class="titlebar">' + dots + tabs + copyBtn + "</div>";

    var panes = FILES.map(function (f) {
      var highlighted = highlightCode(CODE[f.lang], f.lang);
      return (
        '<pre class="mono em-code" data-lang="' + f.lang + '"' +
        (f.active ? "" : ' style="display:none"') + ">" +
        highlighted +
        "</pre>"
      );
    }).join("");

    container.innerHTML =
      '<div class="code-window">' + titlebar + panes + "</div>";

    return container;
  }

  function attachHandlers(root) {
    var tabs = root.querySelectorAll(".fname");
    var panes = root.querySelectorAll("pre.em-code");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var lang = tab.getAttribute("data-lang");

        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");

        panes.forEach(function (pane) {
          pane.style.display = pane.getAttribute("data-lang") === lang ? "block" : "none";
        });
      });
    });

    // Copy button
    var copyBtn = root.querySelector(".copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var activePane = root.querySelector('pre.em-code:not([style*="display:none"])');
        if (!activePane) return;
        var text = activePane.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            showCopiedFeedback(copyBtn);
          }).catch(function () {
            // Fallback
            copyTextFallback(text, copyBtn);
          });
        } else {
          copyTextFallback(text, copyBtn);
        }
      });
    }
  }

  function copyTextFallback(text, btn) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showCopiedFeedback(btn);
    } catch (e) {
      // ignore
    }
    document.body.removeChild(textarea);
  }

  function showCopiedFeedback(btn) {
    var original = btn.textContent;
    btn.textContent = "✓";
    btn.classList.add("copied");
    setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 2000);
  }

  function init() {
    var existing = document.getElementById(CONTAINER_ID);
    const parent = existing ? existing.parentElement : document.currentScript?.parentNode || document.body;
    if (existing) existing.parentNode.removeChild(existing);

    injectStyles();
    var win = buildWindow();
    attachHandlers(win);

    parent.appendChild(win);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();