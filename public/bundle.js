
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(component, store, callback) {
        const unsub = store.subscribe(callback);
        component.$$.on_destroy.push(unsub.unsubscribe
            ? () => unsub.unsubscribe()
            : unsub);
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(changed, child_ctx);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/assets/ArrowIcon.svelte generated by Svelte v3.6.7 */

    const file = "src/assets/ArrowIcon.svelte";

    function create_fragment(ctx) {
    	var svg, g, path;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path = svg_element("path");
    			attr(path, "d", "M360.731,229.075l-225.1-225.1c-5.3-5.3-13.8-5.3-19.1,0s-5.3,13.8,0,19.1l215.5,215.5l-215.5,215.5 c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4c3.4,0,6.9-1.3,9.5-4l225.1-225.1C365.931,242.875,365.931,234.275,360.731,229.075z ");
    			add_location(path, file, 2, 2, 54);
    			add_location(g, file, 1, 1, 48);
    			attr(svg, "width", "24");
    			attr(svg, "viewBox", "0 0 477.175 477.175");
    			add_location(svg, file, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g);
    			append(g, path);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    class ArrowIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, []);
    	}
    }

    /* src/components/Header.svelte generated by Svelte v3.6.7 */

    const file$1 = "src/components/Header.svelte";

    function create_fragment$1(ctx) {
    	var header, div1, t0, div0, t2, current;

    	var arrowicon0 = new ArrowIcon({ $$inline: true });

    	var arrowicon1 = new ArrowIcon({ $$inline: true });

    	return {
    		c: function create() {
    			header = element("header");
    			div1 = element("div");
    			arrowicon0.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			div0.textContent = "Jul 2017";
    			t2 = space();
    			arrowicon1.$$.fragment.c();
    			add_location(div0, file$1, 26, 4, 511);
    			attr(div1, "class", "bar svelte-yf321a");
    			add_location(div1, file$1, 24, 2, 471);
    			attr(header, "class", "svelte-yf321a");
    			add_location(header, file$1, 22, 0, 459);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, header, anchor);
    			append(header, div1);
    			mount_component(arrowicon0, div1, null);
    			append(div1, t0);
    			append(div1, div0);
    			append(div1, t2);
    			mount_component(arrowicon1, div1, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(arrowicon0.$$.fragment, local);

    			transition_in(arrowicon1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(arrowicon0.$$.fragment, local);
    			transition_out(arrowicon1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(header);
    			}

    			destroy_component(arrowicon0, );

    			destroy_component(arrowicon1, );
    		}
    	};
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, []);
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.6.7 */

    const file$2 = "src/components/Footer.svelte";

    function create_fragment$2(ctx) {
    	var footer;

    	return {
    		c: function create() {
    			footer = element("footer");
    			footer.textContent = "Svelte";
    			add_location(footer, file$2, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, footer, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(footer);
    			}
    		}
    	};
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, []);
    	}
    }

    const serverUrl = "https://metalz.herokuapp.com";
    const spiritOfMetalUrl = "https://www.spirit-of-metal.com";

    /* src/components/Album/Content.svelte generated by Svelte v3.6.7 */

    const file$3 = "src/components/Album/Content.svelte";

    function create_fragment$3(ctx) {
    	var div5, div0, img, t0, div4, div1, t1, t2, div2, t3, t4, div3, t5, dispose;

    	return {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			t1 = text(ctx.title);
    			t2 = space();
    			div2 = element("div");
    			t3 = text(ctx.author);
    			t4 = space();
    			div3 = element("div");
    			t5 = text(ctx.genre);
    			attr(img, "src", ctx.src);
    			attr(img, "alt", "album-cover");
    			attr(img, "class", "svelte-14jr33o");
    			add_location(img, file$3, 41, 4, 788);
    			attr(div0, "class", "cover svelte-14jr33o");
    			add_location(div0, file$3, 40, 2, 764);
    			attr(div1, "class", "albumTitle svelte-14jr33o");
    			add_location(div1, file$3, 47, 4, 1019);
    			add_location(div2, file$3, 48, 4, 1061);
    			add_location(div3, file$3, 49, 4, 1085);
    			attr(div4, "class", "albumInfo svelte-14jr33o");
    			add_location(div4, file$3, 46, 2, 991);
    			attr(div5, "class", "content svelte-14jr33o");
    			add_location(div5, file$3, 39, 0, 740);
    			dispose = listen(img, "error", ctx.error_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, div0);
    			append(div0, img);
    			append(div5, t0);
    			append(div5, div4);
    			append(div4, div1);
    			append(div1, t1);
    			append(div4, t2);
    			append(div4, div2);
    			append(div2, t3);
    			append(div4, t4);
    			append(div4, div3);
    			append(div3, t5);
    		},

    		p: function update(changed, ctx) {
    			if (changed.src) {
    				attr(img, "src", ctx.src);
    			}

    			if (changed.title) {
    				set_data(t1, ctx.title);
    			}

    			if (changed.author) {
    				set_data(t3, ctx.author);
    			}

    			if (changed.genre) {
    				set_data(t5, ctx.genre);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div5);
    			}

    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { cover_url, title, author, genre } = $$props;
      let src = `${spiritOfMetalUrl}${cover_url}`;

    	const writable_props = ['cover_url', 'title', 'author', 'genre'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Content> was created with unknown prop '${key}'`);
    	});

    	function error_handler() {
    		const $$result = (src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    		$$invalidate('src', src);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('cover_url' in $$props) $$invalidate('cover_url', cover_url = $$props.cover_url);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('author' in $$props) $$invalidate('author', author = $$props.author);
    		if ('genre' in $$props) $$invalidate('genre', genre = $$props.genre);
    	};

    	return {
    		cover_url,
    		title,
    		author,
    		genre,
    		src,
    		error_handler
    	};
    }

    class Content extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$3, safe_not_equal, ["cover_url", "title", "author", "genre"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.cover_url === undefined && !('cover_url' in props)) {
    			console.warn("<Content> was created without expected prop 'cover_url'");
    		}
    		if (ctx.title === undefined && !('title' in props)) {
    			console.warn("<Content> was created without expected prop 'title'");
    		}
    		if (ctx.author === undefined && !('author' in props)) {
    			console.warn("<Content> was created without expected prop 'author'");
    		}
    		if (ctx.genre === undefined && !('genre' in props)) {
    			console.warn("<Content> was created without expected prop 'genre'");
    		}
    	}

    	get cover_url() {
    		throw new Error("<Content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cover_url(value) {
    		throw new Error("<Content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get author() {
    		throw new Error("<Content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set author(value) {
    		throw new Error("<Content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get genre() {
    		throw new Error("<Content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set genre(value) {
    		throw new Error("<Content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/IconLink.svelte generated by Svelte v3.6.7 */

    const file$4 = "src/components/IconLink.svelte";

    function create_fragment$4(ctx) {
    	var a, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			a = element("a");

    			if (default_slot) default_slot.c();

    			attr(a, "href", ctx.href);
    			attr(a, "target", "_blank");
    			add_location(a, file$4, 3, 0, 41);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(a_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}

    			if (!current || changed.href) {
    				attr(a, "href", ctx.href);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { href = "" } = $$props;

    	const writable_props = ['href'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<IconLink> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('href' in $$props) $$invalidate('href', href = $$props.href);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { href, $$slots, $$scope };
    }

    class IconLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$4, safe_not_equal, ["href"]);
    	}

    	get href() {
    		throw new Error("<IconLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<IconLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/assets/LastFmIcon.svelte generated by Svelte v3.6.7 */

    const file$5 = "src/assets/LastFmIcon.svelte";

    function create_fragment$5(ctx) {
    	var svg, path0, path1;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr(path0, "d", "m256 512c140.960938 0 256-115.050781 256-256 0-140.960938-115.050781-256-256-256-140.960938 0-256 115.050781-256 256 0 140.960938 115.050781 256 256 256zm0-482c124.617188 0 226 101.382812 226 226s-101.382812 226-226 226-226-101.382812-226-226 101.382812-226 226-226zm0 0");
    			add_location(path0, file$5, 1, 1, 40);
    			attr(path1, "d", "m196 361c28.046875 0 54.414062-10.921875 74.246094-30.753906l-21.214844-21.214844c-14.164062 14.167969-33 21.96875-53.03125 21.96875-41.355469 0-75-33.644531-75-75s33.644531-75 75-75c45.558594 0 60.523438 33.144531 79.757812 87.730469 7.554688 21.445312 15.367188 43.621093 27.179688 60.570312 14.65625 21.035157 34.191406 31.699219 58.0625 31.699219 33.085938 0 60-26.914062 60-60 0-31.613281-24.574219-57.59375-55.625-59.84375v-.15625h-4.375c-16.542969 0-30-13.457031-30-30s13.457031-30 30-30 30 13.457031 30 30h30c0-33.085938-26.914062-60-60-60s-60 26.914062-60 60c0 32.648438 26.210938 59.289062 58.691406 59.984375l1.308594.015625c16.542969 0 30 13.457031 30 30s-13.457031 30-30 30c-29.976562 0-41.167969-27.449219-56.949219-72.238281-16.914062-48.011719-37.964843-107.761719-108.050781-107.761719-57.898438 0-105 47.101562-105 105s47.101562 105 105 105zm0 0");
    			add_location(path1, file$5, 2, 1, 330);
    			attr(svg, "viewBox", "0 0 512 512");
    			attr(svg, "width", "24");
    			add_location(svg, file$5, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path0);
    			append(svg, path1);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    class LastFmIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, []);
    	}
    }

    /* src/assets/GoogleIcon.svelte generated by Svelte v3.6.7 */

    const file$6 = "src/assets/GoogleIcon.svelte";

    function create_fragment$6(ctx) {
    	var svg, g1, g0, path;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			path = svg_element("path");
    			attr(path, "d", "M473.702,235.076L368.699,174.33c-0.563-0.281-1.149-0.487-1.747-0.635L265.431,115.32L40.672-0.097 c-0.85-0.34-1.7-0.577-2.538-0.717c-0.913-0.205-1.861-0.24-2.826-0.084c-1.209,0.139-2.35,0.514-3.38,1.121 c-2.845,1.211-4.273,4.346-4.273,7.489v494.644c0,3.471,1.736,6.075,4.339,7.81c0.868,0.868,2.603,0.868,4.339,0.868 s2.603,0,4.339-0.868l224.759-124.963l98.788-57.281c0.048,0.001,0.092,0.006,0.141,0.006c1.736,0,2.603-0.868,4.339-2.603l0,0 c0.757-0.253,1.43-0.664,2.019-1.168l102.985-59.578c5.207-2.603,8.678-8.678,8.678-14.753S478.909,238.547,473.702,235.076z M45.011,27.672l238.522,222.91L45.011,481.154V27.672z M350.475,183.876L320.2,214.639l-23.569,23.871l-104.529-97.156 L88.484,44.644l168.269,85.429L350.475,183.876z M256.753,370.452l-166.75,91.97L248.075,309.62l48.557-46.736l53.359,54.043 L256.753,370.452z M365.817,307.633l-56.21-56.931l56.531-57.256l98.887,57.25L365.817,307.633z");
    			add_location(path, file$6, 3, 3, 88);
    			add_location(g0, file$6, 2, 2, 81);
    			attr(g1, "transform", "translate(1 1)");
    			add_location(g1, file$6, 1, 1, 48);
    			attr(svg, "width", "24");
    			attr(svg, "viewBox", "0 0 512.035 512.035");
    			add_location(svg, file$6, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g1);
    			append(g1, g0);
    			append(g0, path);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    class GoogleIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$6, safe_not_equal, []);
    	}
    }

    /* src/assets/YandexIcon.svelte generated by Svelte v3.6.7 */

    const file$7 = "src/assets/YandexIcon.svelte";

    function create_fragment$7(ctx) {
    	var svg, path0, path1;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr(path0, "d", "m208.464844 400 53.222656-117.585938h23.515625v117.585938h33.414063v-315h-59.171876c-37.664062 0-82.539062 39.609375-82.539062 103.964844 0 64.367187 56.3125 90.355468 56.3125 90.355468l-66.835938 120.679688zm20.636718-160.847656c-8.222656-10.332032-15.382812-27.523438-15.382812-56.058594 0-62.507812 35.941406-70.582031 40.898438-71.394531.355468-.058594.703124-.078125 1.058593-.078125h28.59375v142.945312h-22.246093c-12.71875 0-25-5.464844-32.921876-15.414062zm0 0");
    			add_location(path0, file$7, 0, 38, 38);
    			attr(path1, "d", "m0 0v485h485v-485zm455 455h-425v-425h425zm0 0");
    			add_location(path1, file$7, 0, 524, 524);
    			attr(svg, "viewBox", "0 0 485 485");
    			attr(svg, "width", "24");
    			add_location(svg, file$7, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path0);
    			append(svg, path1);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    class YandexIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$7, safe_not_equal, []);
    	}
    }

    /* src/components/Album/Footer.svelte generated by Svelte v3.6.7 */

    const file$8 = "src/components/Album/Footer.svelte";

    // (28:0) {#if listeners}
    function create_if_block(ctx) {
    	var div3, div1, t0, div0, t1_value = ctx.listeners.toLocaleString(), t1, t2, div2, t3, current;

    	var iconlink = new IconLink({
    		props: {
    		href: ctx.lastfm_url,
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var if_block0 = (ctx.yandex_link) && create_if_block_2(ctx);

    	var if_block1 = (ctx.google_link) && create_if_block_1(ctx);

    	return {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			iconlink.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			attr(div0, "class", "svelte-jrtc59");
    			add_location(div0, file$8, 34, 6, 783);
    			attr(div1, "class", "lastFmContainer svelte-jrtc59");
    			add_location(div1, file$8, 30, 4, 671);
    			add_location(div2, file$8, 37, 4, 839);
    			attr(div3, "class", "footer svelte-jrtc59");
    			add_location(div3, file$8, 28, 2, 645);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div1);
    			mount_component(iconlink, div1, null);
    			append(div1, t0);
    			append(div1, div0);
    			append(div0, t1);
    			append(div3, t2);
    			append(div3, div2);
    			if (if_block0) if_block0.m(div2, null);
    			append(div2, t3);
    			if (if_block1) if_block1.m(div2, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var iconlink_changes = {};
    			if (changed.lastfm_url) iconlink_changes.href = ctx.lastfm_url;
    			if (changed.$$scope) iconlink_changes.$$scope = { changed, ctx };
    			iconlink.$set(iconlink_changes);

    			if ((!current || changed.listeners) && t1_value !== (t1_value = ctx.listeners.toLocaleString())) {
    				set_data(t1, t1_value);
    			}

    			if (ctx.yandex_link) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div2, t3);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (ctx.google_link) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconlink.$$.fragment, local);

    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(iconlink.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div3);
    			}

    			destroy_component(iconlink, );

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};
    }

    // (32:6) <IconLink href={lastfm_url}>
    function create_default_slot_2(ctx) {
    	var current;

    	var lastfmicon = new LastFmIcon({ $$inline: true });

    	return {
    		c: function create() {
    			lastfmicon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(lastfmicon, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(lastfmicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(lastfmicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(lastfmicon, detaching);
    		}
    	};
    }

    // (39:6) {#if yandex_link}
    function create_if_block_2(ctx) {
    	var current;

    	var iconlink = new IconLink({
    		props: {
    		href: `https://music.yandex.ru/album/${ctx.yandex_link}`,
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			iconlink.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(iconlink, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var iconlink_changes = {};
    			if (changed.yandex_link) iconlink_changes.href = `https://music.yandex.ru/album/${ctx.yandex_link}`;
    			if (changed.$$scope) iconlink_changes.$$scope = { changed, ctx };
    			iconlink.$set(iconlink_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconlink.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(iconlink.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(iconlink, detaching);
    		}
    	};
    }

    // (40:8) <IconLink href={`https://music.yandex.ru/album/${yandex_link}`}>
    function create_default_slot_1(ctx) {
    	var current;

    	var yandexicon = new YandexIcon({ $$inline: true });

    	return {
    		c: function create() {
    			yandexicon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(yandexicon, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(yandexicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(yandexicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(yandexicon, detaching);
    		}
    	};
    }

    // (44:6) {#if google_link}
    function create_if_block_1(ctx) {
    	var current;

    	var iconlink = new IconLink({
    		props: {
    		href: `https://play.google.com/music/m/${ctx.google_link}`,
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			iconlink.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(iconlink, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var iconlink_changes = {};
    			if (changed.google_link) iconlink_changes.href = `https://play.google.com/music/m/${ctx.google_link}`;
    			if (changed.$$scope) iconlink_changes.$$scope = { changed, ctx };
    			iconlink.$set(iconlink_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconlink.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(iconlink.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(iconlink, detaching);
    		}
    	};
    }

    // (45:8) <IconLink href={`https://play.google.com/music/m/${google_link}`}>
    function create_default_slot(ctx) {
    	var current;

    	var googleicon = new GoogleIcon({ $$inline: true });

    	return {
    		c: function create() {
    			googleicon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(googleicon, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(googleicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(googleicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(googleicon, detaching);
    		}
    	};
    }

    function create_fragment$8(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.listeners) && create_if_block(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.listeners) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	
      let { listeners = 0, lastfm_url, yandex_link, google_link } = $$props;

    	const writable_props = ['listeners', 'lastfm_url', 'yandex_link', 'google_link'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('listeners' in $$props) $$invalidate('listeners', listeners = $$props.listeners);
    		if ('lastfm_url' in $$props) $$invalidate('lastfm_url', lastfm_url = $$props.lastfm_url);
    		if ('yandex_link' in $$props) $$invalidate('yandex_link', yandex_link = $$props.yandex_link);
    		if ('google_link' in $$props) $$invalidate('google_link', google_link = $$props.google_link);
    	};

    	return {
    		listeners,
    		lastfm_url,
    		yandex_link,
    		google_link
    	};
    }

    class Footer$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$8, safe_not_equal, ["listeners", "lastfm_url", "yandex_link", "google_link"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.lastfm_url === undefined && !('lastfm_url' in props)) {
    			console.warn("<Footer> was created without expected prop 'lastfm_url'");
    		}
    		if (ctx.yandex_link === undefined && !('yandex_link' in props)) {
    			console.warn("<Footer> was created without expected prop 'yandex_link'");
    		}
    		if (ctx.google_link === undefined && !('google_link' in props)) {
    			console.warn("<Footer> was created without expected prop 'google_link'");
    		}
    	}

    	get listeners() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listeners(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lastfm_url() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lastfm_url(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get yandex_link() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set yandex_link(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get google_link() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set google_link(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Album/index.svelte generated by Svelte v3.6.7 */

    const file$9 = "src/components/Album/index.svelte";

    function create_fragment$9(ctx) {
    	var div, t, current;

    	var content = new Content({
    		props: {
    		cover_url: ctx.cover_url,
    		title: ctx.title,
    		author: ctx.author,
    		genre: ctx.genre
    	},
    		$$inline: true
    	});

    	var footer = new Footer$1({
    		props: {
    		listeners: ctx.listeners,
    		lastfm_url: ctx.lastfm_url,
    		yandex_link: ctx.yandex_link,
    		google_link: ctx.google_link
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			content.$$.fragment.c();
    			t = space();
    			footer.$$.fragment.c();
    			attr(div, "class", "album svelte-1cq87o9");
    			add_location(div, file$9, 26, 0, 495);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(content, div, null);
    			append(div, t);
    			mount_component(footer, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var content_changes = {};
    			if (changed.cover_url) content_changes.cover_url = ctx.cover_url;
    			if (changed.title) content_changes.title = ctx.title;
    			if (changed.author) content_changes.author = ctx.author;
    			if (changed.genre) content_changes.genre = ctx.genre;
    			content.$set(content_changes);

    			var footer_changes = {};
    			if (changed.listeners) footer_changes.listeners = ctx.listeners;
    			if (changed.lastfm_url) footer_changes.lastfm_url = ctx.lastfm_url;
    			if (changed.yandex_link) footer_changes.yandex_link = ctx.yandex_link;
    			if (changed.google_link) footer_changes.google_link = ctx.google_link;
    			footer.$set(footer_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(content.$$.fragment, local);

    			transition_in(footer.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(content.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(content, );

    			destroy_component(footer, );
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	
      let { album = {} } = $$props;
      const {
        cover_url,
        title,
        author,
        genre,
        listeners,
        lastfm_url,
        yandex_link,
        google_link
      } = album;

    	const writable_props = ['album'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('album' in $$props) $$invalidate('album', album = $$props.album);
    	};

    	return {
    		album,
    		cover_url,
    		title,
    		author,
    		genre,
    		listeners,
    		lastfm_url,
    		yandex_link,
    		google_link
    	};
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$9, safe_not_equal, ["album"]);
    	}

    	get album() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set album(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (!stop) {
                    return; // not ready
                }
                subscribers.forEach((s) => s[1]());
                subscribers.forEach((s) => s[0](value));
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function getAlbums(
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1
    ) {
      return fetch(`${serverUrl}?year=${year}&month=${month}`)
        .then(data => data.json())
        .then(res => res.body);
    }

    const isLoading = writable(false);
    const hasError = writable(false);

    const albums = (() => {
      const { subscribe, set, update } = writable([]);
      return {
        subscribe,
        get: (year, month) => {
          isLoading.set(true);
          getAlbums(year, month)
            .then(data => set(data))
            .catch(err => hasError.set(true))
            .finally(() => isLoading.set(false));
        },
      };
    })();

    const currentMonth = (() => {
      const { subscribe, set, update } = writable(new Date());
      return {
        subscribe,
        nextMonth: () =>
          update(date => {
            return new Date(date.setMonth(date.getMonth() + 1));
          }),
        prevMonth: () =>
          update(date => {
            return new Date(date.setMonth(date.getMonth() - 1));
          }),
      };
    })();

    window.currentMonth = currentMonth;
    currentMonth.subscribe(value => {
      albums.get(value.getFullYear(), value.getMonth() + 1);
    });

    /* src/components/Main.svelte generated by Svelte v3.6.7 */

    const file$a = "src/components/Main.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.album = list[i];
    	child_ctx.index = i;
    	return child_ctx;
    }

    // (17:2) {:else}
    function create_else_block(ctx) {
    	var each_blocks = [], each_1_lookup = new Map(), each_1_anchor, current;

    	var each_value = ctx.$albums.slice(0, 10);

    	const get_key = ctx => ctx.album.album_id;

    	for (var i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	return {
    		c: function create() {
    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(target, anchor);

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			const each_value = ctx.$albums.slice(0, 10);

    			group_outros();
    			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    			check_outros();
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			for (i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d(detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (15:2) {#if $isLoading}
    function create_if_block$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Loading...");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (18:4) {#each $albums.slice(0, 10) as album, index (album.album_id)}
    function create_each_block(key_1, ctx) {
    	var first, current;

    	var album = new Index({
    		props: { album: ctx.album },
    		$$inline: true
    	});

    	return {
    		key: key_1,

    		first: null,

    		c: function create() {
    			first = empty();
    			album.$$.fragment.c();
    			this.first = first;
    		},

    		m: function mount(target, anchor) {
    			insert(target, first, anchor);
    			mount_component(album, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var album_changes = {};
    			if (changed.$albums) album_changes.album = ctx.album;
    			album.$set(album_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(album.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(album.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(first);
    			}

    			destroy_component(album, detaching);
    		}
    	};
    }

    function create_fragment$a(ctx) {
    	var main, current_block_type_index, if_block, current;

    	var if_block_creators = [
    		create_if_block$1,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.$isLoading) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr(main, "class", "main svelte-1bsqhyc");
    			add_location(main, file$a, 13, 0, 215);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $isLoading, $albums;

    	validate_store(isLoading, 'isLoading');
    	subscribe($$self, isLoading, $$value => { $isLoading = $$value; $$invalidate('$isLoading', $isLoading); });
    	validate_store(albums, 'albums');
    	subscribe($$self, albums, $$value => { $albums = $$value; $$invalidate('$albums', $albums); });

    	return { $isLoading, $albums };
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$a, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.6.7 */

    function create_fragment$b(ctx) {
    	var t0, t1, current;

    	var header = new Header({ $$inline: true });

    	var main = new Main({ $$inline: true });

    	var footer = new Footer({ $$inline: true });

    	return {
    		c: function create() {
    			header.$$.fragment.c();
    			t0 = space();
    			main.$$.fragment.c();
    			t1 = space();
    			footer.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(main, target, anchor);
    			insert(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			transition_in(main.$$.fragment, local);

    			transition_in(footer.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(main.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(header, detaching);

    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(main, detaching);

    			if (detaching) {
    				detach(t1);
    			}

    			destroy_component(footer, detaching);
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$b, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
