
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = cb => requestAnimationFrame(cb);

    const tasks = new Set();
    let running = false;
    function run_tasks() {
        tasks.forEach(task => {
            if (!task[0](now())) {
                tasks.delete(task);
                task[1]();
            }
        });
        running = tasks.size > 0;
        if (running)
            raf(run_tasks);
    }
    function loop(fn) {
        let task;
        if (!running) {
            running = true;
            raf(run_tasks);
        }
        return {
            promise: new Promise(fulfil => {
                tasks.add(task = [fn, fulfil]);
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
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

    /* src/assets/LeftArrowIcon.svelte generated by Svelte v3.6.7 */

    const file = "src/assets/LeftArrowIcon.svelte";

    function create_fragment(ctx) {
    	var svg, g, path;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path = svg_element("path");
    			attr(path, "d", "M360.731,229.075l-225.1-225.1c-5.3-5.3-13.8-5.3-19.1,0s-5.3,13.8,0,19.1l215.5,215.5l-215.5,215.5\n      c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4c3.4,0,6.9-1.3,9.5-4l225.1-225.1C365.931,242.875,365.931,234.275,360.731,229.075z\n      ");
    			add_location(path, file, 6, 4, 137);
    			add_location(g, file, 5, 2, 129);
    			attr(svg, "width", "24");
    			attr(svg, "viewBox", "0 0 477.175 477.175");
    			attr(svg, "transform", "rotate(180)");
    			attr(svg, "fill", ctx.fill);
    			add_location(svg, file, 4, 0, 49);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g);
    			append(g, path);
    		},

    		p: function update(changed, ctx) {
    			if (changed.fill) {
    				attr(svg, "fill", ctx.fill);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { fill = "black" } = $$props;

    	const writable_props = ['fill'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<LeftArrowIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('fill' in $$props) $$invalidate('fill', fill = $$props.fill);
    	};

    	return { fill };
    }

    class LeftArrowIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["fill"]);
    	}

    	get fill() {
    		throw new Error("<LeftArrowIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<LeftArrowIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/assets/RightArrowIcon.svelte generated by Svelte v3.6.7 */

    const file$1 = "src/assets/RightArrowIcon.svelte";

    function create_fragment$1(ctx) {
    	var svg, g, path;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path = svg_element("path");
    			attr(path, "d", "M360.731,229.075l-225.1-225.1c-5.3-5.3-13.8-5.3-19.1,0s-5.3,13.8,0,19.1l215.5,215.5l-215.5,215.5\n      c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4c3.4,0,6.9-1.3,9.5-4l225.1-225.1C365.931,242.875,365.931,234.275,360.731,229.075z\n      ");
    			add_location(path, file$1, 6, 4, 113);
    			add_location(g, file$1, 5, 2, 105);
    			attr(svg, "width", "24");
    			attr(svg, "viewBox", "0 0 477.175 477.175");
    			attr(svg, "fill", ctx.fill);
    			add_location(svg, file$1, 4, 0, 49);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g);
    			append(g, path);
    		},

    		p: function update(changed, ctx) {
    			if (changed.fill) {
    				attr(svg, "fill", ctx.fill);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { fill = "black" } = $$props;

    	const writable_props = ['fill'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<RightArrowIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('fill' in $$props) $$invalidate('fill', fill = $$props.fill);
    	};

    	return { fill };
    }

    class RightArrowIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["fill"]);
    	}

    	get fill() {
    		throw new Error("<RightArrowIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<RightArrowIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
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
    /**
     * Derived value store by synchronizing one or more readable stores and
     * applying an aggregation function over its input values.
     * @param {Stores} stores input stores
     * @param {function(Stores=, function(*)=):*}fn function callback that aggregates the values
     * @param {*=}initial_value when used asynchronously
     */
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        const invalidators = [];
        const store = readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                run_all(invalidators);
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
        return {
            subscribe(run, invalidate = noop) {
                invalidators.push(invalidate);
                const unsubscribe = store.subscribe(run, invalidate);
                return () => {
                    const index = invalidators.indexOf(invalidate);
                    if (index !== -1) {
                        invalidators.splice(index, 1);
                    }
                    unsubscribe();
                };
            }
        };
    }

    const serverUrl = 'https://metalz.herokuapp.com';
    const spiritOfMetalUrl = 'https://www.spirit-of-metal.com';

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
    const coverPreviewSrc = writable(null);
    const filterYandex = writable(false);
    const filterGoogle = writable(false);
    const sortByAphabet = writable(false);
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

    const sortedAlbums = derived(
      [albums, filterYandex, filterGoogle, sortByAphabet],
      ([$albums, $filterYandex, $filterGoogle, $sortByAphabet]) => {
        return $albums
          .filter(album => {
            const yandex = $filterYandex ? !!album.yandex_link : true;
            const google = $filterGoogle ? !!album.google_link : true;
            return yandex && google;
          })
          .sort((a, b) => {
            if ($sortByAphabet) {
              return a.title < b.title ? -1 : 1;
            } else {
              return a.listeners < b.listeners ? 1 : -1;
            }
          });
      }
    );

    function getLang() {
      if (navigator.languages != undefined) return navigator.languages[0];
      else return navigator.language;
    }
    const lang = getLang();
    const translation = {
      month: {
        'ru-RU': ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'],
        'en-US': ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEN', 'OCT', 'NOV', 'DEC'],
      },
    };

    function translate(text) {
      return translation[text][lang] ? translation[text][lang] : translation[text]['en-US'];
    }

    /* src/components/IconButton.svelte generated by Svelte v3.6.7 */

    const file$2 = "src/components/IconButton.svelte";

    function create_fragment$2(ctx) {
    	var button, current, dispose;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			attr(button, "class", "button svelte-kazscr");
    			add_location(button, file$2, 20, 0, 271);
    			dispose = listen(button, "click", ctx.onClick);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
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
    				detach(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { onClick = () => {} } = $$props;

    	const writable_props = ['onClick'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<IconButton> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('onClick' in $$props) $$invalidate('onClick', onClick = $$props.onClick);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { onClick, $$slots, $$scope };
    }

    class IconButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["onClick"]);
    	}

    	get onClick() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Header.svelte generated by Svelte v3.6.7 */

    const file$3 = "src/components/Header.svelte";

    // (27:2) <IconButton onClick={currentMonth.prevMonth}>
    function create_default_slot_1(ctx) {
    	var current;

    	var leftarrowicon = new LeftArrowIcon({ $$inline: true });

    	return {
    		c: function create() {
    			leftarrowicon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(leftarrowicon, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(leftarrowicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(leftarrowicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(leftarrowicon, detaching);
    		}
    	};
    }

    // (33:2) <IconButton onClick={currentMonth.nextMonth}>
    function create_default_slot(ctx) {
    	var current;

    	var rightarrowicon = new RightArrowIcon({ $$inline: true });

    	return {
    		c: function create() {
    			rightarrowicon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(rightarrowicon, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(rightarrowicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(rightarrowicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(rightarrowicon, detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var header, t0, div, t1_value = translate('month')[ctx.$currentMonth.getMonth()], t1, t2_value = ' ', t2, t3_value = ctx.$currentMonth.getFullYear(), t3, t4, current;

    	var iconbutton0 = new IconButton({
    		props: {
    		onClick: currentMonth.prevMonth,
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var iconbutton1 = new IconButton({
    		props: {
    		onClick: currentMonth.nextMonth,
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			header = element("header");
    			iconbutton0.$$.fragment.c();
    			t0 = space();
    			div = element("div");
    			t1 = text(t1_value);
    			t2 = text(t2_value);
    			t3 = text(t3_value);
    			t4 = space();
    			iconbutton1.$$.fragment.c();
    			add_location(div, file$3, 29, 2, 720);
    			attr(header, "class", "svelte-1r44n8u");
    			add_location(header, file$3, 24, 0, 622);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, header, anchor);
    			mount_component(iconbutton0, header, null);
    			append(header, t0);
    			append(header, div);
    			append(div, t1);
    			append(div, t2);
    			append(div, t3);
    			append(header, t4);
    			mount_component(iconbutton1, header, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var iconbutton0_changes = {};
    			if (changed.currentMonth) iconbutton0_changes.onClick = currentMonth.prevMonth;
    			if (changed.$$scope) iconbutton0_changes.$$scope = { changed, ctx };
    			iconbutton0.$set(iconbutton0_changes);

    			if ((!current || changed.$currentMonth) && t1_value !== (t1_value = translate('month')[ctx.$currentMonth.getMonth()])) {
    				set_data(t1, t1_value);
    			}

    			if ((!current || changed.$currentMonth) && t3_value !== (t3_value = ctx.$currentMonth.getFullYear())) {
    				set_data(t3, t3_value);
    			}

    			var iconbutton1_changes = {};
    			if (changed.currentMonth) iconbutton1_changes.onClick = currentMonth.nextMonth;
    			if (changed.$$scope) iconbutton1_changes.$$scope = { changed, ctx };
    			iconbutton1.$set(iconbutton1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton0.$$.fragment, local);

    			transition_in(iconbutton1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(iconbutton0.$$.fragment, local);
    			transition_out(iconbutton1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(header);
    			}

    			destroy_component(iconbutton0, );

    			destroy_component(iconbutton1, );
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $currentMonth;

    	validate_store(currentMonth, 'currentMonth');
    	subscribe($$self, currentMonth, $$value => { $currentMonth = $$value; $$invalidate('$currentMonth', $currentMonth); });

    	return { $currentMonth };
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
    	}
    }

    /* src/assets/YandexIcon.svelte generated by Svelte v3.6.7 */

    const file$4 = "src/assets/YandexIcon.svelte";

    function create_fragment$4(ctx) {
    	var svg, path0, path1;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr(path0, "d", "m208.464844 400\n    53.222656-117.585938h23.515625v117.585938h33.414063v-315h-59.171876c-37.664062\n    0-82.539062 39.609375-82.539062 103.964844 0 64.367187 56.3125 90.355468\n    56.3125 90.355468l-66.835938\n    120.679688zm20.636718-160.847656c-8.222656-10.332032-15.382812-27.523438-15.382812-56.058594\n    0-62.507812 35.941406-70.582031\n    40.898438-71.394531.355468-.058594.703124-.078125\n    1.058593-.078125h28.59375v142.945312h-22.246093c-12.71875\n    0-25-5.464844-32.921876-15.414062zm0 0");
    			add_location(path0, file$4, 5, 2, 97);
    			attr(path1, "d", "m0 0v485h485v-485zm455 455h-425v-425h425zm0 0");
    			add_location(path1, file$4, 15, 2, 617);
    			attr(svg, "viewBox", "0 0 485 485");
    			attr(svg, "width", "24");
    			attr(svg, "fill", ctx.fill);
    			add_location(svg, file$4, 4, 0, 49);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path0);
    			append(svg, path1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.fill) {
    				attr(svg, "fill", ctx.fill);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { fill = "black" } = $$props;

    	const writable_props = ['fill'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<YandexIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('fill' in $$props) $$invalidate('fill', fill = $$props.fill);
    	};

    	return { fill };
    }

    class YandexIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["fill"]);
    	}

    	get fill() {
    		throw new Error("<YandexIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<YandexIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/assets/GoogleIcon.svelte generated by Svelte v3.6.7 */

    const file$5 = "src/assets/GoogleIcon.svelte";

    function create_fragment$5(ctx) {
    	var svg, g1, g0, path;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			path = svg_element("path");
    			attr(path, "d", "M473.702,235.076L368.699,174.33c-0.563-0.281-1.149-0.487-1.747-0.635L265.431,115.32L40.672-0.097\n        c-0.85-0.34-1.7-0.577-2.538-0.717c-0.913-0.205-1.861-0.24-2.826-0.084c-1.209,0.139-2.35,0.514-3.38,1.121\n        c-2.845,1.211-4.273,4.346-4.273,7.489v494.644c0,3.471,1.736,6.075,4.339,7.81c0.868,0.868,2.603,0.868,4.339,0.868\n        s2.603,0,4.339-0.868l224.759-124.963l98.788-57.281c0.048,0.001,0.092,0.006,0.141,0.006c1.736,0,2.603-0.868,4.339-2.603l0,0\n        c0.757-0.253,1.43-0.664,2.019-1.168l102.985-59.578c5.207-2.603,8.678-8.678,8.678-14.753S478.909,238.547,473.702,235.076z\n        M45.011,27.672l238.522,222.91L45.011,481.154V27.672z\n        M350.475,183.876L320.2,214.639l-23.569,23.871l-104.529-97.156\n        L88.484,44.644l168.269,85.429L350.475,183.876z\n        M256.753,370.452l-166.75,91.97L248.075,309.62l48.557-46.736l53.359,54.043\n        L256.753,370.452z\n        M365.817,307.633l-56.21-56.931l56.531-57.256l98.887,57.25L365.817,307.633z");
    			add_location(path, file$5, 7, 6, 150);
    			add_location(g0, file$5, 6, 4, 140);
    			attr(g1, "transform", "translate(1 1)");
    			add_location(g1, file$5, 5, 2, 105);
    			attr(svg, "width", "24");
    			attr(svg, "viewBox", "0 0 512.035 512.035");
    			attr(svg, "fill", ctx.fill);
    			add_location(svg, file$5, 4, 0, 49);
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

    		p: function update(changed, ctx) {
    			if (changed.fill) {
    				attr(svg, "fill", ctx.fill);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { fill = "black" } = $$props;

    	const writable_props = ['fill'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<GoogleIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('fill' in $$props) $$invalidate('fill', fill = $$props.fill);
    	};

    	return { fill };
    }

    class GoogleIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["fill"]);
    	}

    	get fill() {
    		throw new Error("<GoogleIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<GoogleIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.6.7 */

    const file$6 = "src/components/Footer.svelte";

    // (25:2) <IconButton onClick={() => filterYandex.update(state => !state)}>
    function create_default_slot_2(ctx) {
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

    // (28:2) <IconButton onClick={() => filterGoogle.update(state => !state)}>
    function create_default_slot_1$1(ctx) {
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

    // (31:2) <IconButton onClick={() => sortByAphabet.update(state => !state)}>
    function create_default_slot$1(ctx) {
    	var t_value = ctx.$sortByAphabet ? 'AZ' : '321', t;

    	return {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.$sortByAphabet) && t_value !== (t_value = ctx.$sortByAphabet ? 'AZ' : '321')) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	var footer, t0, t1, current;

    	var iconbutton0 = new IconButton({
    		props: {
    		onClick: ctx.func,
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var iconbutton1 = new IconButton({
    		props: {
    		onClick: ctx.func_1,
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var iconbutton2 = new IconButton({
    		props: {
    		onClick: ctx.func_2,
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			footer = element("footer");
    			iconbutton0.$$.fragment.c();
    			t0 = space();
    			iconbutton1.$$.fragment.c();
    			t1 = space();
    			iconbutton2.$$.fragment.c();
    			attr(footer, "class", "svelte-cqby9k");
    			add_location(footer, file$6, 23, 0, 589);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, footer, anchor);
    			mount_component(iconbutton0, footer, null);
    			append(footer, t0);
    			mount_component(iconbutton1, footer, null);
    			append(footer, t1);
    			mount_component(iconbutton2, footer, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var iconbutton0_changes = {};
    			if (changed.filterYandex) iconbutton0_changes.onClick = ctx.func;
    			if (changed.$$scope) iconbutton0_changes.$$scope = { changed, ctx };
    			iconbutton0.$set(iconbutton0_changes);

    			var iconbutton1_changes = {};
    			if (changed.filterGoogle) iconbutton1_changes.onClick = ctx.func_1;
    			if (changed.$$scope) iconbutton1_changes.$$scope = { changed, ctx };
    			iconbutton1.$set(iconbutton1_changes);

    			var iconbutton2_changes = {};
    			if (changed.sortByAphabet) iconbutton2_changes.onClick = ctx.func_2;
    			if (changed.$$scope || changed.$sortByAphabet) iconbutton2_changes.$$scope = { changed, ctx };
    			iconbutton2.$set(iconbutton2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton0.$$.fragment, local);

    			transition_in(iconbutton1.$$.fragment, local);

    			transition_in(iconbutton2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(iconbutton0.$$.fragment, local);
    			transition_out(iconbutton1.$$.fragment, local);
    			transition_out(iconbutton2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(footer);
    			}

    			destroy_component(iconbutton0, );

    			destroy_component(iconbutton1, );

    			destroy_component(iconbutton2, );
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $sortByAphabet;

    	validate_store(sortByAphabet, 'sortByAphabet');
    	subscribe($$self, sortByAphabet, $$value => { $sortByAphabet = $$value; $$invalidate('$sortByAphabet', $sortByAphabet); });

    	function func() {
    		return filterYandex.update(state => !state);
    	}

    	function func_1() {
    		return filterGoogle.update(state => !state);
    	}

    	function func_2() {
    		return sortByAphabet.update(state => !state);
    	}

    	return { $sortByAphabet, func, func_1, func_2 };
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, []);
    	}
    }

    /* src/components/Album/Content.svelte generated by Svelte v3.6.7 */

    const file$7 = "src/components/Album/Content.svelte";

    function create_fragment$7(ctx) {
    	var div5, div0, img, t0, div4, div1, t1, t2, div2, t3, t4, div3, t5, dispose;

    	return {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			t1 = text(ctx.author);
    			t2 = space();
    			div2 = element("div");
    			t3 = text(ctx.title);
    			t4 = space();
    			div3 = element("div");
    			t5 = text(ctx.genre);
    			attr(img, "src", ctx.src);
    			attr(img, "alt", "album-cover");
    			attr(img, "class", "svelte-14jr33o");
    			add_location(img, file$7, 45, 4, 929);
    			attr(div0, "class", "cover svelte-14jr33o");
    			add_location(div0, file$7, 44, 2, 884);
    			attr(div1, "class", "albumTitle svelte-14jr33o");
    			add_location(div1, file$7, 51, 4, 1160);
    			add_location(div2, file$7, 52, 4, 1203);
    			add_location(div3, file$7, 53, 4, 1226);
    			attr(div4, "class", "albumInfo svelte-14jr33o");
    			add_location(div4, file$7, 50, 2, 1132);
    			attr(div5, "class", "content svelte-14jr33o");
    			add_location(div5, file$7, 43, 0, 860);

    			dispose = [
    				listen(img, "error", ctx.error_handler),
    				listen(div0, "click", ctx.viewCover)
    			];
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

    			if (changed.author) {
    				set_data(t1, ctx.author);
    			}

    			if (changed.title) {
    				set_data(t3, ctx.title);
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

    			run_all(dispose);
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	
      let { cover_url, title, author, genre } = $$props;
      let src = `${spiritOfMetalUrl}${cover_url}`;
      const viewCover = () => {
        coverPreviewSrc.set(src);
      };

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
    		viewCover,
    		error_handler
    	};
    }

    class Content extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["cover_url", "title", "author", "genre"]);

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

    const file$8 = "src/components/IconLink.svelte";

    function create_fragment$8(ctx) {
    	var a, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			a = element("a");

    			if (default_slot) default_slot.c();

    			attr(a, "href", ctx.href);
    			attr(a, "target", "_blank");
    			add_location(a, file$8, 3, 0, 41);
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

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["href"]);
    	}

    	get href() {
    		throw new Error("<IconLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<IconLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/assets/LastFmIcon.svelte generated by Svelte v3.6.7 */

    const file$9 = "src/assets/LastFmIcon.svelte";

    function create_fragment$9(ctx) {
    	var svg, path0, path1;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr(path0, "d", "m256 512c140.960938 0 256-115.050781 256-256\n    0-140.960938-115.050781-256-256-256-140.960938 0-256 115.050781-256 256 0\n    140.960938 115.050781 256 256 256zm0-482c124.617188 0 226 101.382812 226\n    226s-101.382812 226-226 226-226-101.382812-226-226 101.382812-226 226-226zm0\n    0");
    			add_location(path0, file$9, 5, 2, 97);
    			attr(path1, "d", "m196 361c28.046875 0 54.414062-10.921875\n    74.246094-30.753906l-21.214844-21.214844c-14.164062 14.167969-33\n    21.96875-53.03125 21.96875-41.355469 0-75-33.644531-75-75s33.644531-75\n    75-75c45.558594 0 60.523438 33.144531 79.757812 87.730469 7.554688 21.445312\n    15.367188 43.621093 27.179688 60.570312 14.65625 21.035157 34.191406\n    31.699219 58.0625 31.699219 33.085938 0 60-26.914062 60-60\n    0-31.613281-24.574219-57.59375-55.625-59.84375v-.15625h-4.375c-16.542969\n    0-30-13.457031-30-30s13.457031-30 30-30 30 13.457031 30\n    30h30c0-33.085938-26.914062-60-60-60s-60 26.914062-60 60c0 32.648438\n    26.210938 59.289062 58.691406 59.984375l1.308594.015625c16.542969 0 30\n    13.457031 30 30s-13.457031 30-30 30c-29.976562\n    0-41.167969-27.449219-56.949219-72.238281-16.914062-48.011719-37.964843-107.761719-108.050781-107.761719-57.898438\n    0-105 47.101562-105 105s47.101562 105 105 105zm0 0");
    			add_location(path1, file$9, 11, 2, 403);
    			attr(svg, "viewBox", "0 0 512 512");
    			attr(svg, "width", "24");
    			attr(svg, "fill", ctx.fill);
    			add_location(svg, file$9, 4, 0, 49);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path0);
    			append(svg, path1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.fill) {
    				attr(svg, "fill", ctx.fill);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { fill = "black" } = $$props;

    	const writable_props = ['fill'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<LastFmIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('fill' in $$props) $$invalidate('fill', fill = $$props.fill);
    	};

    	return { fill };
    }

    class LastFmIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["fill"]);
    	}

    	get fill() {
    		throw new Error("<LastFmIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<LastFmIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Album/Footer.svelte generated by Svelte v3.6.7 */

    const file$a = "src/components/Album/Footer.svelte";

    // (28:0) {#if listeners}
    function create_if_block(ctx) {
    	var div3, div1, t0, div0, t1_value = ctx.listeners.toLocaleString(), t1, t2, div2, t3, current;

    	var iconlink = new IconLink({
    		props: {
    		href: ctx.lastfm_url,
    		$$slots: { default: [create_default_slot_2$1] },
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
    			add_location(div0, file$a, 34, 6, 783);
    			attr(div1, "class", "lastFmContainer svelte-jrtc59");
    			add_location(div1, file$a, 30, 4, 671);
    			add_location(div2, file$a, 37, 4, 839);
    			attr(div3, "class", "footer svelte-jrtc59");
    			add_location(div3, file$a, 28, 2, 645);
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
    function create_default_slot_2$1(ctx) {
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
    		$$slots: { default: [create_default_slot_1$2] },
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
    function create_default_slot_1$2(ctx) {
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
    		$$slots: { default: [create_default_slot$2] },
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
    function create_default_slot$2(ctx) {
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

    function create_fragment$a(ctx) {
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

    function instance$a($$self, $$props, $$invalidate) {
    	
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, ["listeners", "lastfm_url", "yandex_link", "google_link"]);

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

    const file$b = "src/components/Album/index.svelte";

    function create_fragment$b(ctx) {
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
    			attr(div, "class", "album svelte-1gbgi9f");
    			add_location(div, file$b, 47, 0, 773);
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

    function instance$b($$self, $$props, $$invalidate) {
    	
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, ["album"]);
    	}

    	get album() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set album(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Loader.svelte generated by Svelte v3.6.7 */

    const file$c = "src/components/Loader.svelte";

    function create_fragment$c(ctx) {
    	var div, svg, g, path;

    	return {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path = svg_element("path");
    			attr(path, "d", "M386.163,48.499L217.807,216.857c-7.646,1.901-15.05,1.533-20.277-3.687c-12.381-12.381,5.53-39.459,14.835-51.738\n        c2.679-3.528,1.751-4.749-2.27-2.877l-36.834,17.142c-4.015,1.872-7.902,6.927-8.846,11.257\n        c-2.914,13.387-9.812,40.158-20.3,50.646c-11.8,11.798-82.429,25.519-106.325,29.892c-4.358,0.781-7.938,4.98-8.299,9.405\n        c-2.96,36.347-21.045,78.954-28.722,95.669c-1.855,4.023-0.254,5.582,3.767,3.719c52.676-24.389,89.847-12.383,98.364-3.859\n        c7.402,7.406-14.757,78.178-22.421,101.781c-1.365,4.207,0.651,5.902,4.554,3.803l72.122-38.932\n        c3.901-2.101,7.801-7.326,8.782-11.65c4.711-20.73,18.372-76.357,32.366-90.355c12.106-12.106,32.801-15.608,44.144-16.639\n        c4.412-0.389,9.78-3.542,11.94-7.405l15.028-26.718c2.176-3.863,1.134-4.729-2.585-2.312c-11.27,7.334-34.737,19.188-50.468,3.455\n        c-6.854-6.854-5.67-18.459-0.974-31.05L405.423,66.358c3.418-2.843,11.95-9.004,19.119-6.083c0,0,27.139-32.226,45.456-31.881\n        c0,0,6.268-14.074,12.034-25.271L387.565,24.32C387.565,24.32,395.488,36.873,386.163,48.499z\n        M155.207,330.984l-9.043,9.037\n        c-3.136,3.134-8.213,3.134-11.353,0l-24.115-24.109c-3.132-3.146-3.132-8.219,0-11.364l9.043-9.037\n        c3.132-3.138,8.209-3.138,11.349,0l24.119,24.108C158.339,322.765,158.339,327.839,155.207,330.984z\n        M191.599,283.235\n        c3.136,3.131,3.136,8.204,0,11.346l-9.041,9.049c-3.132,3.126-8.211,3.126-11.351,0l-24.119-24.121\n        c-3.132-3.126-3.132-8.207,0-11.345l9.047-9.045c3.132-3.138,8.211-3.138,11.351,0l4.027,4.023l18.556,18.562L191.599,283.235z");
    			attr(path, "fill", "#b2102f");
    			add_location(path, file$c, 31, 6, 599);
    			add_location(g, file$c, 30, 4, 589);
    			attr(svg, "width", "100");
    			attr(svg, "height", "100");
    			attr(svg, "viewBox", "0 0 482.032 482.032");
    			attr(svg, "class", "svelte-4kvlrp");
    			add_location(svg, file$c, 29, 2, 524);
    			attr(div, "class", "loader svelte-4kvlrp");
    			add_location(div, file$c, 28, 0, 501);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, svg);
    			append(svg, g);
    			append(g, path);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    class Loader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$c, safe_not_equal, []);
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400 }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/assets/CloseIcon.svelte generated by Svelte v3.6.7 */

    const file$d = "src/assets/CloseIcon.svelte";

    function create_fragment$d(ctx) {
    	var svg, g, path;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path = svg_element("path");
    			attr(path, "fill", "#fff");
    			attr(path, "d", "M28.941,31.786L0.613,60.114c-0.787,0.787-0.787,2.062,0,2.849c0.393,0.394,0.909,0.59,1.424,0.59\n      c0.516,0,1.031-0.196,1.424-0.59l28.541-28.541l28.541,28.541c0.394,0.394,0.909,0.59,1.424,0.59c0.515,0,1.031-0.196,1.424-0.59\n      c0.787-0.787,0.787-2.062,0-2.849L35.064,31.786L63.41,3.438c0.787-0.787,0.787-2.062,0-2.849c-0.787-0.786-2.062-0.786-2.848,0\n      L32.003,29.15L3.441,0.59c-0.787-0.786-2.061-0.786-2.848,0c-0.787,0.787-0.787,2.062,0,2.849L28.941,31.786z");
    			add_location(path, file$d, 2, 4, 47);
    			add_location(g, file$d, 1, 2, 39);
    			attr(svg, "width", "24");
    			attr(svg, "viewBox", "0 0 64 64");
    			add_location(svg, file$d, 0, 0, 0);
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

    class CloseIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$d, safe_not_equal, []);
    	}
    }

    /* src/components/CoverPreview.svelte generated by Svelte v3.6.7 */

    const file$e = "src/components/CoverPreview.svelte";

    // (39:0) {#if $coverPreviewSrc}
    function create_if_block$1(ctx) {
    	var div1, div0, t, img, img_transition, div1_transition, current, dispose;

    	var iconbutton = new IconButton({
    		props: {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	iconbutton.$on("click", ctx.click_handler);

    	return {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			iconbutton.$$.fragment.c();
    			t = space();
    			img = element("img");
    			attr(div0, "class", "close svelte-1vet6va");
    			add_location(div0, file$e, 43, 4, 877);
    			attr(img, "src", ctx.$coverPreviewSrc);
    			attr(img, "alt", "cover-preview");
    			attr(img, "class", "svelte-1vet6va");
    			add_location(img, file$e, 48, 4, 1016);
    			attr(div1, "class", "coverPreview svelte-1vet6va");
    			add_location(div1, file$e, 39, 2, 755);
    			dispose = listen(div1, "click", ctx.click_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			mount_component(iconbutton, div0, null);
    			append(div1, t);
    			append(div1, img);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var iconbutton_changes = {};
    			if (changed.$$scope) iconbutton_changes.$$scope = { changed, ctx };
    			iconbutton.$set(iconbutton_changes);

    			if (!current || changed.$coverPreviewSrc) {
    				attr(img, "src", ctx.$coverPreviewSrc);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton.$$.fragment, local);

    			add_render_callback(() => {
    				if (!img_transition) img_transition = create_bidirectional_transition(img, fly, { duration: 200 }, true);
    				img_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: 200 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(iconbutton.$$.fragment, local);

    			if (!img_transition) img_transition = create_bidirectional_transition(img, fly, { duration: 200 }, false);
    			img_transition.run(0);

    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: 200 }, false);
    			div1_transition.run(0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			destroy_component(iconbutton, );

    			if (detaching) {
    				if (img_transition) img_transition.end();
    				if (div1_transition) div1_transition.end();
    			}

    			dispose();
    		}
    	};
    }

    // (45:6) <IconButton on:click={() => coverPreviewSrc.set(null)}>
    function create_default_slot$3(ctx) {
    	var current;

    	var closeicon = new CloseIcon({ $$inline: true });

    	return {
    		c: function create() {
    			closeicon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(closeicon, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(closeicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(closeicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(closeicon, detaching);
    		}
    	};
    }

    function create_fragment$e(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.$coverPreviewSrc) && create_if_block$1(ctx);

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
    			if (ctx.$coverPreviewSrc) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
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

    function instance$c($$self, $$props, $$invalidate) {
    	let $coverPreviewSrc;

    	validate_store(coverPreviewSrc, 'coverPreviewSrc');
    	subscribe($$self, coverPreviewSrc, $$value => { $coverPreviewSrc = $$value; $$invalidate('$coverPreviewSrc', $coverPreviewSrc); });

    	function click_handler() {
    		return coverPreviewSrc.set(null);
    	}

    	function click_handler_1() {
    		return coverPreviewSrc.set(null);
    	}

    	return {
    		$coverPreviewSrc,
    		click_handler,
    		click_handler_1
    	};
    }

    class CoverPreview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$e, safe_not_equal, []);
    	}
    }

    /* src/components/Main.svelte generated by Svelte v3.6.7 */

    const file$f = "src/components/Main.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.album = list[i];
    	child_ctx.index = i;
    	return child_ctx;
    }

    // (47:2) {:else}
    function create_else_block(ctx) {
    	var each_blocks = [], each_1_lookup = new Map(), each_1_anchor, current;

    	var each_value = ctx.$sortedAlbums.slice(0, ctx.limit);

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
    			const each_value = ctx.$sortedAlbums.slice(0, ctx.limit);

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

    // (45:2) {#if $isLoading}
    function create_if_block$2(ctx) {
    	var current;

    	var loader = new Loader({ $$inline: true });

    	return {
    		c: function create() {
    			loader.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(loader, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(loader, detaching);
    		}
    	};
    }

    // (50:6) {#if (index + 1) % 5 === 0 || index + 1 === limit}
    function create_if_block_1$1(ctx) {
    	var span, span_index_value;

    	return {
    		c: function create() {
    			span = element("span");
    			attr(span, "index", span_index_value = ctx.index);
    			add_location(span, file$f, 50, 8, 1206);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    			ctx.span_binding(span);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.$sortedAlbums || changed.limit) && span_index_value !== (span_index_value = ctx.index)) {
    				attr(span, "index", span_index_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			ctx.span_binding(null);
    		}
    	};
    }

    // (48:4) {#each $sortedAlbums.slice(0, limit) as album, index (album.album_id)}
    function create_each_block(key_1, ctx) {
    	var first, t, if_block_anchor, current;

    	var album = new Index({
    		props: { album: ctx.album },
    		$$inline: true
    	});

    	var if_block = ((ctx.index + 1) % 5 === 0 || ctx.index + 1 === ctx.limit) && create_if_block_1$1(ctx);

    	return {
    		key: key_1,

    		first: null,

    		c: function create() {
    			first = empty();
    			album.$$.fragment.c();
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},

    		m: function mount(target, anchor) {
    			insert(target, first, anchor);
    			mount_component(album, target, anchor);
    			insert(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var album_changes = {};
    			if (changed.$sortedAlbums || changed.limit) album_changes.album = ctx.album;
    			album.$set(album_changes);

    			if ((ctx.index + 1) % 5 === 0 || ctx.index + 1 === ctx.limit) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
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

    			if (detaching) {
    				detach(t);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function create_fragment$f(ctx) {
    	var t, main, current_block_type_index, if_block, current;

    	var coverpreview = new CoverPreview({ $$inline: true });

    	var if_block_creators = [
    		create_if_block$2,
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
    			coverpreview.$$.fragment.c();
    			t = space();
    			main = element("main");
    			if_block.c();
    			attr(main, "class", "main svelte-1axtuls");
    			add_location(main, file$f, 43, 0, 978);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(coverpreview, target, anchor);
    			insert(target, t, anchor);
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
    			transition_in(coverpreview.$$.fragment, local);

    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(coverpreview.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(coverpreview, detaching);

    			if (detaching) {
    				detach(t);
    				detach(main);
    			}

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $isLoading, $sortedAlbums;

    	validate_store(isLoading, 'isLoading');
    	subscribe($$self, isLoading, $$value => { $isLoading = $$value; $$invalidate('$isLoading', $isLoading); });
    	validate_store(sortedAlbums, 'sortedAlbums');
    	subscribe($$self, sortedAlbums, $$value => { $sortedAlbums = $$value; $$invalidate('$sortedAlbums', $sortedAlbums); });

    	
      let trigger;
      let limit = 11;
      const options = {
        root: document.querySelector(".main"),
        rootMargin: "10px",
        threshold: 1.0
      };
      const callback = function(entries, observer) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            $$invalidate('limit', limit = +entry.target.getAttribute("index") + 10);
          }
        });
      };
      const observer = new IntersectionObserver(callback, options);

      afterUpdate(() => {
        if (trigger) observer.observe(trigger);
      });

    	function span_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('trigger', trigger = $$value);
    		});
    	}

    	return {
    		trigger,
    		limit,
    		$isLoading,
    		$sortedAlbums,
    		span_binding
    	};
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$f, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.6.7 */

    function create_fragment$g(ctx) {
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
    		init(this, options, null, create_fragment$g, safe_not_equal, []);
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
