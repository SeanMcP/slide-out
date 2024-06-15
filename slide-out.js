const focusableSelector = ":is(button, [role=button], [href], input, select, textarea, [tabindex]:not([tabindex='-1'])):not([slot])"

export default class SlideOut extends HTMLElement {
    constructor() {
        super();
        this.trigger = this.querySelector("[slot=trigger]");
        this.shadow = this.attachShadow({ mode: "open" });
        this.timeout = null;
        this.transitionDurationMS = parseInt(this.getAttribute("transition-duration-ms")) || 500;

        if (!this.getAttribute("aria-labelledby")) {
            throw new Error("The aria-labelledby attribute is required.");
        }
    }

    get backdrop() {
        if (!this._backdrop) {
            this._backdrop = this.shadow.querySelector("[data-id=backdrop]");
        }
        return this._backdrop;
    }

    get close() {
        if (!this._close) {
            // Light DOM if provided or Shadow DOM fallback
            this._close = this.querySelector("[slot=close]")
                || this.shadow.querySelector("[name=close] button");
        }
        return this._close;
    }

    get section() {
        if (!this._section) {
            this._section = this.shadow.querySelector("section");
        }
        return this._section;
    }

    get lastFocusableChild() {
        let focusableChildren = [...this.querySelectorAll(focusableSelector)]
        return focusableChildren[focusableChildren.length - 1];
    }

    openDialog() {
        clearTimeout(this.timeout);
        this.section.dataset.state = "opening";
        this.section.removeAttribute("aria-hidden");
        this.close.focus();
        this.timeout = setTimeout(() => {
            this.shadow.querySelector("section").dataset.state = "open";
        }, this.transitionDurationMS);
    }

    closeDialog() {
        clearTimeout(this.timeout);
        this.section.dataset.state = "closing";
        this.section.setAttribute("aria-hidden", "true");
        this.trigger.focus();
        this.timeout = setTimeout(() => {
            this.section.dataset.state = "closed";
        }, this.transitionDurationMS);
    }

    connectedCallback() {
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.section.dataset.state === "open") {
                this.closeDialog();
            }
            if (e.key === "Tab" && !e.shiftKey && this.section.dataset.state === "open") {
                let lastFocusableChild = this.lastFocusableChild;
                if (!lastFocusableChild || lastFocusableChild === document.activeElement) {
                    e.preventDefault();
                    this.close.focus();
                }
            }
        });

        this.addEventListener("click", e => {
            if (e.target.dataset.close != null) {
                this.closeDialog();
            }
        });

        this.shadow.innerHTML = /*html*/`
<style>
:host {
    --backdrop-color: hsla(0, 0%, 0%, 0.5);
    --slide-out-background-color: white;
    --slide-out-max-width: 500px;
    --slide-out-padding: 1rem;
    --timing-function: ease-in-out;
    --transition-duration: ${this.transitionDurationMS}ms;
}
section {
    background-color: var(--slide-out-background-color);
    bottom: 0;
    display: flex;
    flex-direction: column;
    max-width: var(--slide-out-max-width);
    position: fixed;
    right: 0;
    top: 0;
    transition: transform var(--transition-duration) var(--timing-function);
    width: calc(100% - 2 * var(--slide-out-padding));
    z-index: 1;
}
section[data-state="closed"] {
    visibility: hidden;
}
section:is([data-state="closed"], [data-state=closing]) {
    transform: translateX(100%);
}
section[data-state=opening] {
    transform: translateX(0);
}
section > * {
    padding: var(--slide-out-padding);
}
section > div {
    flex: 1;
    overflow-y: auto;
}
section + span {
    transition: opacity var(--transition-duration) var(--timing-function);
}
section:not([data-state=closed]) + span {
    background-color: var(--backdrop-color);
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}
section:is([data-state="closing"], [data-state=closed]) + span {
    opacity: 0;
}
section[data-state=closed] + span {
    visibility: hidden;
}
section header {
    display: flex;
    justify-content: end;
    padding-block-end: 0;
}
</style>

<slot name="trigger"></slot>
<section
    aria-describedby="${this.getAttribute("aria-describedby") || ""}"
    aria-labelledby="${this.getAttribute("aria-labelledby")}"
    aria-modal="true"
    role="dialog"
    data-state="closed"
>
    <header><slot name="close"><button>Close</button></slot></header>
    <div><slot name="content"></slot></div>
</section>
<span data-id="backdrop"></span>
        `;

        this.trigger.addEventListener("click", () => {
            this.openDialog();
        });

        this.close.addEventListener("click", () => {
            this.closeDialog();
        });
        this.close.addEventListener("keydown", (e) => {
            if (e.key === "Tab" && e.shiftKey) {
                e.preventDefault();
                if (this.lastFocusableChild) {
                    this.lastFocusableChild.focus();
                }
            }
        });

        this.backdrop.addEventListener("click", () => {
            this.closeDialog();
        });
    }
}

customElements.define("slide-out", SlideOut);