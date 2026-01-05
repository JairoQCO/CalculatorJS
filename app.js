
    const state = {
      current: "0",
      previous: null,
      operator: null,
      justEvaluated: false,
      history: ""
    };

    const displayEl = document.getElementById("display");
    const historyEl = document.getElementById("history");

    function updateUI() {
      displayEl.textContent = formatNumber(state.current);
      historyEl.textContent = state.history;
    }

    function formatNumber(str) {
      if (!isFiniteNumberString(str)) return str;

      const hasTrailingDot = str.endsWith(".");
      const [intPart, decPart] = str.replace(".", "·").split("·");

      const sign = intPart.startsWith("-") ? "-" : "";
      const absInt = sign ? intPart.slice(1) : intPart;

      const safeInt = absInt === "" ? "0" : absInt;

      const grouped = safeInt.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      let out = sign + grouped;
      if (decPart !== undefined) out += "." + decPart;
      if (hasTrailingDot && decPart === undefined) out += ".";
      return out;
    }

    function isFiniteNumberString(str) {
      if (typeof str !== "string") return false;
      if (str === "" || str === "-" || str === ".") return false;
      const n = Number(str);
      return Number.isFinite(n);
    }

    function setError(msg = "Error") {
      state.current = msg;
      state.previous = null;
      state.operator = null;
      state.justEvaluated = true;
      state.history = "";
      updateUI();
    }

    function inputDigit(d) {
      if (state.current === "Error" || state.current === "∞") state.current = "0";

      if (state.justEvaluated) {
        state.current = d;
        state.justEvaluated = false;
        state.history = "";
        updateUI();
        return;
      }

      if (state.current === "0") {
        state.current = d;
      } else if (state.current === "-0") {
        state.current = "-" + d;
      } else {
        state.current += d;
      }
      updateUI();
    }

    function inputDot() {
      if (state.current === "Error" || state.current === "∞") state.current = "0";

      if (state.justEvaluated) {
        state.current = "0.";
        state.justEvaluated = false;
        state.history = "";
        updateUI();
        return;
      }

      if (!state.current.includes(".")) {
        state.current += ".";
      }
      updateUI();
    }

    function toggleSign() {
      if (!isFiniteNumberString(state.current) && !state.current.endsWith(".")) return;

      if (state.current.startsWith("-")) {
        state.current = state.current.slice(1);
      } else if (state.current !== "0" && state.current !== "0.") {
        state.current = "-" + state.current;
      } else if (state.current === "0") {
        state.current = "-0";
      }
      updateUI();
    }

    function percent() {
      if (!isFiniteNumberString(state.current) && !state.current.endsWith(".")) return;

      const n = Number(state.current.endsWith(".") ? state.current.slice(0, -1) : state.current);
      if (!Number.isFinite(n)) return setError();

      state.current = String(n / 100);
      updateUI();
    }

    function clearAll() {
      state.current = "0";
      state.previous = null;
      state.operator = null;
      state.justEvaluated = false;
      state.history = "";
      updateUI();
    }

    function del() {
      if (state.justEvaluated) return;

      if (state.current === "Error" || state.current === "∞") {
        state.current = "0";
        updateUI();
        return;
      }

      if (state.current.length <= 1) {
        state.current = "0";
      } else if (state.current.length === 2 && state.current.startsWith("-")) {
        state.current = "0";
      } else {
        state.current = state.current.slice(0, -1);
      }
      updateUI();
    }

    function chooseOperator(op) {
      if (state.current === "Error" || state.current === "∞") return;

      if (state.current.endsWith(".")) state.current = state.current.slice(0, -1) || "0";

      if (state.operator && state.previous !== null && !state.justEvaluated) {
        evaluate();
      }

      state.operator = op;
      state.previous = state.current;
      state.justEvaluated = false;

      const symbol = opToSymbol(op);
      state.history = `${formatNumber(state.previous)} ${symbol}`;
      state.current = "0";
      updateUI();
    }

    function opToSymbol(op) {
      if (op === "+") return "+";
      if (op === "-") return "−";
      if (op === "*") return "×";
      if (op === "/") return "÷";
      return op;
    }

    function evaluate() {
      if (state.current === "Error" || state.current === "∞") return;

      if (!state.operator || state.previous === null) {
        state.justEvaluated = true;
        updateUI();
        return;
      }

      const currentStr = state.current.endsWith(".") ? state.current.slice(0, -1) || "0" : state.current;

      const a = Number(state.previous);
      const b = Number(currentStr);

      if (!Number.isFinite(a) || !Number.isFinite(b)) return setError();

      let result;
      switch (state.operator) {
        case "+": result = a + b; break;
        case "-": result = a - b; break;
        case "*": result = a * b; break;
        case "/":
          if (b === 0) return setError("∞");
          result = a / b;
          break;
        default:
          return setError();
      }

      result = roundSmart(result);

      state.history = `${formatNumber(String(a))} ${opToSymbol(state.operator)} ${formatNumber(String(b))} =`;
      state.current = String(result);
      state.previous = null;
      state.operator = null;
      state.justEvaluated = true;
      updateUI();
    }

    function roundSmart(n) {
      const s = n.toFixed(12);
      return Number(s);
    }

    document.querySelector(".keys").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const action = btn.dataset.action;
      const value = btn.dataset.value;

      switch (action) {
        case "digit": return inputDigit(value);
        case "dot": return inputDot();
        case "op": return chooseOperator(value);
        case "equals": return evaluate();
        case "ac": return clearAll();
        case "del": return del();
        case "sign": return toggleSign();
        case "percent": return percent();
      }
    });

    window.addEventListener("keydown", (e) => {
      const k = e.key;

      if (k >= "0" && k <= "9") return inputDigit(k);
      if (k === "." || k === ",") return inputDot();

      if (k === "+" || k === "-" || k === "*" || k === "/") return chooseOperator(k);

      if (k === "Enter" || k === "=") {
        e.preventDefault();
        return evaluate();
      }

      if (k === "Backspace") return del();
      if (k === "Escape") return clearAll();
      if (k === "%") return percent();
    });

    updateUI();
