/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 搜索框控件
 * @author otakustay
 */
define(
    function (require) {
        var eoo = require('eoo');
        var lib = require('./lib');
        var esui = require('esui');
        var Control = require('./Control');
        var painters = require('./painters');
        var u = require('underscore');
        var $ = require('jquery');

        require('./TextBox');
        require('./Button');

        /**
         * 搜索框控件，由一个文本框和一个搜索按钮组成
         *
         * @extends Control
         * @param {Object} [options] 初始化参数
         * @constructor
         */
        var SearchBox = eoo.create(
            Control,
            {

                /**
                 * @override
                 */
                type: 'SearchBox',

                /**
                 * 初始化参数
                 *
                 * @param {Object} [options] 构造函数传入的参数
                 * @protected
                 * @override
                 */
                initOptions: function (options) {
                    var properties = {
                        // 搜索模式：`instant`、`normal`
                        searchMode: 'normal',
                        // 搜索框内容为空，默认为search图标，使用时不转义
                        buttonContent: '',
                        // 搜索button默认的样式为primary
                        buttonVariants: 'primary icon',
                        // 搜索button默认的位置为left
                        buttonPosition: 'left',
                        // 默认值为''
                        text: '',
                        // 控件内部使用的状态，外部MUST NOT设置该属性
                        searched: false,
                        width: ''
                    };
                    u.extend(properties, options);

                    if (lib.isInput(this.main)) {
                        if (!properties.placeholder) {
                            properties.placeholder = lib.getAttribute(this.main, 'placeholder');
                        }

                        if (!properties.text) {
                            properties.text = this.main.value;
                        }

                        if (!properties.maxLength
                            && (lib.hasAttribute(this.main, 'maxlength') || this.main.maxLength > 0)) {
                            properties.maxLength = this.main.maxLength;
                        }
                    }

                    if (!properties.title) {
                        properties.title = this.main.title;
                    }

                    if (properties.text) {
                        properties.searched = true;
                    }

                    Control.prototype.initOptions.call(this, properties);
                },

                /**
                 * 初始化DOM结构
                 *
                 * @protected
                 * @override
                 */
                initStructure: function () {
                    var tpl = ''
                        + '<div data-ui-type="TextBox" data-ui-mode="text" data-ui-child-name="text"'
                        +     'data-ui-placeholder="${placeholder}" data-ui-icon="${clearClasses}"'
                        +     'data-ui-variants="icon-right" data-ui-width="auto">'
                        + '</div>';
                    var addonTPL = getAddonHTML.apply(this);

                    // instant模式下搜索图标在textbox前
                    if (this.buttonPosition === 'left') {
                        tpl = addonTPL + tpl;
                    }
                    // normal模式下搜索图标在textbox之后
                    else if (this.buttonPosition === 'right') {
                        tpl += addonTPL;
                    }

                    var html = lib.format(
                        tpl,
                        {
                            placeholder: this.placeholder,
                            clearClasses: this.helper.getIconClass('times-circle')
                        }
                    );

                    if (lib.isInput(this.main)) {
                        this.helper.replaceMain();
                    }
                    if (this.buttonPosition) {
                        $(this.main).addClass(this.helper.getPrefixClass('textbox-wrapper'));
                    }

                    this.main.innerHTML = html;
                    this.helper.initChildren(this.main);
                },

                /**
                 * 初始化事件交互
                 *
                 * @protected
                 * @override
                 */
                initEvents: function () {
                    var textbox = this.getChild('text');
                    var me = this;

                    // 处理输入事件
                    textbox.on('input', u.bind(onInput, me));

                    // 回车时要取消掉默认行为，否则会把所在的表单给提交了
                    textbox.on(
                        'keypress',
                        function (e) {
                            if (e.keyCode === 13) {
                                e.preventDefault();
                            }
                        }
                    );

                    textbox.on('enter', function () {
                        me.fire('search');
                    });

                    // 清除搜索按钮
                    textbox.on('iconclick', u.bind(clear, me));
                    textbox.on('focus', u.bind(me.addState, me, 'focus'));
                    textbox.on('blur', u.bind(me.removeState, me, 'focus'));

                    var searchButton = me.getChild('search');
                    if (searchButton) {
                        searchButton.on('click', function () {
                            me.fire('search');
                        });
                    }
                },

                /**
                 * 获取输入值
                 *
                 * @return {string}
                 * @override
                 */
                getValue: function () {
                    var text = this.getChild('text');
                    return text.getValue();
                },

                /**
                 * 渲染自身
                 *
                 * @protected
                 * @override
                 */
                repaint: painters.createRepaint(
                    Control.prototype.repaint,
                    painters.attribute('title'),
                    {
                        name: [
                            'maxLength', 'placeholder', 'text',
                            'height', 'disabled', 'readOnly'
                        ],
                        /* eslint-disable max-params */
                        paint: function (box, maxLength, placeholder, text, height, disabled, readOnly) {
                            var properties = {
                                /**
                                 * @property {number} maxLength
                                 *
                                 * 最大长度，参考{@link TextBox#maxLength}
                                 */
                                maxLength: maxLength,
                                /**
                                 * @property {string} placeholder
                                 *
                                 * 无内容时的提示文字，参考{@link TextBox#placeholder}
                                 */
                                placeholder: placeholder,
                                /**
                                 * @property {string} text
                                 *
                                 * 文字内容
                                 */
                                value: text,
                                height: height,
                                disabled: disabled,
                                readOnly: readOnly
                            };
                            box.getChild('text').setProperties(properties);
                        }
                        /* eslint-enable max-params */
                    },
                    {
                        name: 'disabled',
                        paint: function (box, disabled) {
                            var searchButton = box.getChild('search');
                            searchButton && searchButton.set('disabled', disabled);
                        }
                    },
                    {
                        /**
                         * @property {number} width
                         *
                         * 搜索框的宽度
                         */
                        name: 'width',
                        paint: function (box, width) {
                            if (width && !isNaN(width)) {
                                box.main.style.width = width + 'px';
                            }
                        }
                    },
                    {
                        /**
                         * @property {boolean} searched
                         *
                         * 设定SearchBox是否已有搜素关键词
                         */
                        name: 'searched',
                        paint: function (box, searched) {
                            var method = searched ? 'addState' : 'removeState';
                            box[method]('searched');
                        }
                    },
                    {
                        /**
                         * @property {boolean} searched
                         *
                         * 设定SearchBox的工作模式：`instant` | `normal`
                         */
                        name: 'searchMode',
                        paint: function (box, searchMode) {
                            box.addState(searchMode);
                        }
                    }
                ),

                /**
                 * 获取用于比对的text属性值
                 *
                 * @return {string}
                 * @protected
                 */
                getTextProperty: function () {
                    var textbox = this.getChild('text');
                    return textbox ? textbox.getValue() : this.text;
                }
            }
        );

        /**
         * 获取搜索按钮或搜索图标HTML
         *
         * @return {string}
         */
        function getAddonHTML() {
            // 即时搜索不需要搜索按钮
            var addonContent = '<span class="${searchIconClasses}"></span>';
            // never used var notInstant = this.searchMode !== 'instant';
            // normal模式下有搜索按钮
            addonContent = ''
            + '<button data-ui="type:Button;childName:search;variants:${buttonVariants}"'
            +     'class="${searchClasses}">'
            +     (this.buttonContent ? this.buttonContent : addonContent)
            + '</button>';
            var tpl = ''
                + '<div class="${addonClasses}">'
                +     addonContent
                + '</div>';
            var helper = this.helper;

            return lib.format(
                tpl,
                {
                    searchIconClasses: helper.getIconClass('search'),
                    buttonVariants: this.buttonVariants,
                    searchClasses: helper.getPartClassName('search'),
                    addonClasses: helper.getPrefixClass('textbox-addon')
                }
            );
        }

        /**
         * 处理输入框的input事件，根据输入框是否有内容增加/移除`searched`状态
         */
        function onInput() {
            var me = this;
            var textbox = this.getChild('text');
            var method = textbox.getValue() ? 'addState' : 'removeState';
            this[method]('searched');
            
            // 即时模式下输入触发搜索
            if (me.searchMode === 'instant') {
                me.fire('search');
            }
        }

        /**
         * 清除搜索关键词，`instant`模式下触发搜索
         */
        function clear() {
            var textbox = this.getChild('text');
            textbox.setValue('');
            this.removeState('searched');
            if (this.searchMode === 'instant') {
                this.fire('search');
            }
            else {
                this.fire('clear');
            }
        }

        esui.register(SearchBox);
        return SearchBox;
    }
);
