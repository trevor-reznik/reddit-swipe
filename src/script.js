/**
 * @author Christian P. Byrne
 * @from Sep 21
 *
 * @todo
 *      1. auto refresh when runnig low on posts of page
 *      3. youtube version
 *      5. maybe make the original hide button white text to hide it? or make it 0width so
 *          it's unclickable on accidednt if it's hidden.
 *
 *
 */

class Page {
  constructor(animations = true) {
    this.blockList = [
      // Interaction options on each post (share, crosspost, etc)
      ".unvoted.entry > .top-matter > .buttons.flat-list > .crosspost-button > .post-crosspost-button",
      ".unvoted.entry > .top-matter > .buttons.flat-list > .crosspost-button",
      ".unvoted.entry > .top-matter > .buttons.flat-list > .login-required.report-button",
      ".unvoted.entry > .top-matter > .buttons.flat-list > .give-gold-button > .gold-give-gold.access-required.login-required.give-gold",
      ".unvoted.entry > .top-matter > .buttons.flat-list > .login-required.save-button.link-save-button",
      ".unvoted.entry > .top-matter > .buttons.flat-list > .share > .post-sharing-button",
      ".unvoted.entry > .top-matter > .title > .domain",
      // Right side premium advertisement box
      ".premium-banner",
      // Login / account details on top right
      ".create.sidebox > .morelink > .access-required.login-required",
      // All right side panel info
      ".side",
      "#header-bottom-right",
      // Top bar of featured subreddits
      "#sr-header-area",
      // Footer
      "div.footer-parent",
      // Welcome Banner (when logged out)
      "section.infobar",
    ];
    this.zapElements();

    this.is = (siteSection) => {
      return window.location.href.includes(siteSection);
    };

    this.noPostsPages = [
      "/comments/",
      "/submit",
      "/user/",
      "/prefs/",
      "/subreddits/",
    ];

    this.postsPage = true;
    for (const pageType of this.noPostsPages) {
      if (this.is(pageType)) {
        this.postsPage = false;
      }
    }

    if (this.postsPage) {
      if (animations) {
        this.addFocusClasses();
      }
      this.table = this.getTable();
      this.posts = this.refreshPosts();

      this.postObjs = [];
      this.initPosts();

      this.minHeight = this.minPostHeight();
      this.minHeightPx = `${this.minHeight}px`;

      this.addHideButtons();

      document.body.addEventListener("click", (event) => {
        if (
          event.target.tagName == "A" &&
          event.target.innerHTML.toLowerCase().includes("hide")
        ) {
          this.autoRefillPosts();
        }
      });

      this.addComponent.hideAllBtn();
    }
  }


  addComponent = {
    hideAllBtn : () => {
       let btnEl = document.createElement("div");
       btnEl.innerHTML = "Hide All";
       const styleMap = {
         "position" : "absolute",
         "top" : ".25%",
         "right" : ".55%",
         "opacity" : ".38",
         "fontSize" : "1.25rem",
         "zIndex" : "99",
         "width" : "max-content",
        "background": "linear-gradient(to right, #f64f59, #c471ed, #12c2e9)",
        "border" : "2px solid white",
        "color" : "hsl(39deg, 100%, 94%)",
        "padding" : ".2rem",
        "borderRadius" : "3px",
        "cursor" : "pointer"
      }
       for ( const [property, value] of Object.entries(styleMap)) {
         btnEl.style[property] = value;
       }
       btnEl.addEventListener("click", () => {
         this.hideAllThenRefresh();
       })
       document.body.append(btnEl);
    }
  }

  hideAllActivePosts = async () => {
    for ( const postObj of this.postObjs) {
      postObj.getHideButton().querySelector("span a").click();
    }
  }

  hideAllThenRefresh = () => {
    this.hideAllActivePosts().then(() => {
      window.location = window.location.href;
    })
  }

  autoRefillPosts = () => {
    console.log(this.activePostsCt());
    if (this.activePostsCt() <= 1) {
      this.refresh();
    }
  };

  activePostsCt = () => {
    let ct = 0;
    for (const post of this.refreshPosts()) {
      if (!post.style.display.includes("none")) {
        ct++;
      }
    }

    return ct;
  };

  refresh = () => {
    window.location = window.location.href;
  };

  /**
   * CSS classes to toggle when hovering. They will be referenced a lot so I think
   * best to insert them into the HTML initially and then reference them the
   * traditional way.
   *
   *
   */
  addFocusClasses = () => {
    let css = document.createElement("style");
    // Add delay to transition animation because cursor is automatically
    // hovering next post when post above it is hidden -- and don't want
    // animation in that case.
    css.innerHTML = `
        .minify-hover {
            padding: 1px !important;
            transition: all .9s ease-in-out 1.2s !important;
            background: linear-gradient(to right,  #f1d5d6, #e5dfe9, #b5dae2);
            opacity: 0.87;
        }
        .minify-hover * {
            color: #121212 !important;
        }
        div.thing {
            transition: all ease-out .2s;
        }`;
    document.querySelector("head").append(css);
  };

  /**
   * Remove all blocked elements. Would it be better to hide them?
   */
  zapElements = () => {
    for (const query of this.blockList) {
      let elements = document.querySelectorAll(query);
      for (const el of elements) {
        el.remove();
      }
    }
  };

  /**
   * Get px height (as number) of shortet post on page not including ads or
   * promoted posts.
   *
   * @returns {number} Height (in terms of px) of the shortest post on page.
   */
  minPostHeight = () => {
    let heights = [];
    for (const post of this.postObjs) {
      heights.push(post.heightInt);
    }
    return Math.min(...heights);
  };

  getTable = () => {
    return document.querySelector("div#siteTable");
  };

  refreshPosts = () => {
    let ret = [];
    for (const post of Array.from(this.table.querySelectorAll("div"))) {
      // First class in classList is "thing" -- should be improved.
      // Don't include adds/promoted posts because they have special configurations which
      // screw up the other functions.
      if (
        post.classList[0] == "thing" &&
        !post.classList.contains("promoted")
      ) {
        ret.push(post);
      }
    }
    return ret;
  };

  initPosts = () => {
    for (const post of this.posts) {
      let obj = new Post(post);
      this.postObjs.push(obj);
    }
  };

  addHideButtons = () => {
    for (const post of this.postObjs) {
      post.insertHideBtn(this.minHeightPx);
    }
  };
}

class Post {
  constructor(li, options) {
    const defaults = {
      refHeight: false,
      refHeightInt: false,
      hideBtn: false,
      btnOffset: false,
      hideButtonStyle: {
        position: "relative",
        cursor: "pointer",
        float: "right",
        opacity: ".82",
        borderRadius: "4px",
        width: "20%",
        fontSize: "1.1rem",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Varela Round, sans-serif",
        background: "linear-gradient(to bottom, #f64f59, #c471ed, #12c2e9)",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      },
    };
    Object.assign(defaults, options);
    Object.assign(this, defaults);
    this.main = li;

    this.thumbnail = li.querySelector("a.thumbnail");
    this.height = window.getComputedStyle(this.main).height;
    this.heightInt = this.height.substring(0, this.height.length - 2);

    this.interactions = this.getInteractionsList();
  }
  /**
   * Binds a listener to the new hide button which just simulates a click
   * on the "old" hide button which is in the standard old Reddit UI.
   * Also binds listeners for the hover animations.
   *
   */
  bindHideListener = () => {
    this.hideBtn.addEventListener("click", () => {
      this.getHideButton().querySelector("span a").click();
    });
    this.hideBtn.addEventListener("mouseover", function () {
      this.parentElement.parentElement.classList.add("minify-hover");
    });
    this.hideBtn.addEventListener("mouseout", function () {
      this.parentElement.parentElement.classList.remove("minify-hover");
    });
  };

  insertHideBtn = (uniformHeight) => {
    this.refHeight = uniformHeight;
    this.refHeightInt = this.refHeight.substring(0, this.refHeight.length - 2);
    this.btnOffset = `${(this.heightInt - this.refHeightInt) / 2}px`;

    this.hideBtn = this.createButton();
    this.addHideText();
    this.appendButton();
    this.bindHideListener();
  };

  fracOfHeight = (fraction) => {
    return `${this.refHeightInt * fraction}px`;
  };

  styleElement = (el, styleProps) => {
    for (const [property, value] of styleProps) {
      el.style[property] = value;
    }
  };

  addHideText = () => {
    let txt = document.createElement("div");
    txt.innerHTML = "HIDE";
    let style = {
      color: "white",
      textAlign: "center",
      padding: `${this.fracOfHeight(0.33)} 0px ${this.fracOfHeight(0.33)} 0px`,
      lineHeight: this.fracOfHeight(0.33),
    };
    this.styleElement(txt, Object.entries(style));
    this.hideBtn.appendChild(txt);
  };

  getInteractionsList = () => {
    return Array.from(this.main.querySelectorAll("li"));
  };

  /**
   *
   * @param {String} keyword Word contained in the visible text of the
   *    interaction (e.g., "hide" or "share").
   */
  findInteraction = (keyword) => {
    for (const li of this.interactions) {
      if (
        li
          .querySelector("a")
          .innerHTML.toLowerCase()
          .contains(keyword.toLowerCase())
      ) {
        return li;
      }
    }
  };

  /**
   * Return the list element that contains the hide button.
   * Should work with all languages -- so it's superior to the findInteraction
   * method with "hide" as arg.
   *
   * @param   {HTMLDivElement}    postEl
   * @returns {HTMLLIElement}     The argument's HTMLLis"hide" button
   */
  getHideButton = () => {
    return Array.from(this.main.querySelectorAll("li")).filter(
      (li) => li.firstElementChild && li.firstElementChild.tagName == "FORM"
    )[0];
  };

  appendButton = () => {
    this.main.querySelector("div.entry").prepend(this.hideBtn);
  };

  createButton = () => {
    Object.assign(this.hideButtonStyle, {
      height: this.refHeight,
      marginTop: this.btnOffset,
    });
    let styleProps = Object.entries(this.hideButtonStyle);

    let btn = document.createElement("div");
    this.styleElement(btn, styleProps);

    return btn;
  };
}

const page = new Page();
