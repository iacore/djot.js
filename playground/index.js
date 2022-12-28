var ast;
var initialized = false;

var filterExamples = {};

window.onload = () => {
  const input = document.getElementById("input");
  input.onkeyup = debounce(parse_and_render, 200);
  input.onscroll = syncScroll;
  document.getElementById("mode").onchange = render;
  document.getElementById("sourcepos").onchange = parse_and_render;

  document.getElementById("filter-examples").onchange = (e) => {
    let examp = filterExamples[e.target.value];
    document.getElementById("filter").value = examp;
  }

  /* filter modal */
  var modal = document.getElementById("filter-modal");
  // Get the button that opens the modal
  var btn = document.getElementById("filter-open");
  // Get the <span> element that closes the modal
  var span = document.getElementById("filter-close");
  // When the user clicks on the button, open the modal
  btn.onclick = function() {
    modal.style.display = "block";
  }
  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
    parse_and_render();
  }
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
      parse_and_render();
    }
  }
  parse_and_render();
}

// scroll the preview window to match the input window.
const syncScroll = () => {
  const mode = document.getElementById("mode").value;
  if (mode == "preview") {
    const textarea = document.getElementById("input");
    const iframe = document.getElementById("preview");
    const previewdoc = iframe.contentDocument;
    const preview = previewdoc.querySelector("#htmlbody");
    const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight);
    // NOTE this assumes we don't have wrapped lines,
    // so we have set white-space:nowrap on the textarea:
    const lineNumber = Math.floor(textarea.scrollTop / lineHeight) + 1;
    const selector = '[data-startpos^="' + lineNumber + ':"]';
    const elt = preview.querySelector(selector);
    if (elt) {
      elt.scrollIntoView({ behavior: "smooth",
                           block: "start",
                           inline: "nearest" });
    }
  }
}



const inject = (iframe, html) => {
  const doc = iframe.contentDocument;
  if (doc) {
    const body = doc.querySelector("#htmlbody");
    if (body) body.innerHTML = html;
  }
}

const debounce = (func, delay) => {
    let debounceTimer
    return function() {
        const context = this
        const args = arguments
            clearTimeout(debounceTimer)
                debounceTimer
            = setTimeout(() => func.apply(context, args), delay)
    }
}

const ignoreWarnings = () => {
};

function parse_and_render() {
  const text = document.getElementById("input").value;
  const filter = null // TODO: document.getElementById("filter").value;
  try {
    var startTime = new Date().getTime();
    ast = djot.parse(text, { sourcePositions: true, warn: ignoreWarnings });
    if (filter) {
      djot.applyFilter(filter);
      document.getElementById("filter-error").innerText = err;
      /* open filter so they can edit some more and see error message */
      document.getElementById("filter-modal").style.display = "block";
      filter.style.display = "block";
      document.getElementById("filter-error").innerText = "";
    }
    render();
    var endTime = new Date().getTime();
    var elapsedTime = endTime - startTime;
    document.getElementById("elapsed-time").innerText = elapsedTime;
    document.getElementById("kbps").innerText = ((text.length / elapsedTime)).toFixed(1);
    document.getElementById("timing").style.visibility = "visible";
  } catch (err) {
    document.getElementById("filter-error").innerText = err;
  }
}

function render() {
  const text = document.getElementById("input").value;
  const mode = document.getElementById("mode").value;
  const iframe = document.getElementById("preview");
  document.getElementById("result").innerHTML = "";
  const result = document.getElementById("result");
  const sourcepos = document.getElementById("sourcepos").checked;

  if (mode == "astjson") {
    result.innerText = JSON.stringify(ast, null, 2);
  } else if (mode == "ast") {
    result.innerText = djot.renderAST(ast);
  } else if (mode == "events") {
    let events = [];
    for (let event of new djot.Block.EventParser(text)) {
      events.push(`{ startpos: ${event.startpos}, endpos: ${event.endpos}, annot: "${event.annot}" }`);
    }
    result.innerText = "[" + events.join("\n,") + "]";
  } else if (mode == "html") {
    result.innerText = djot.renderHTML(ast, { sourcePositions: sourcepos });
  } else if (mode == "preview") {
    let rendered = djot.renderHTML(ast, { sourcePositions: true });
    inject(iframe, rendered);
  }
  iframe.style.display = mode == "preview" ? "block" : "none";
  result.style.display = mode == "preview" ? "none" : "block";
}