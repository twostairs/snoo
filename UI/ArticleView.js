const UI = require('./UI').default;
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();
const _ = require('lodash');

/**
 * ArticleView Class
 */
module.exports.default = class ArticleView extends UI {
    /**
     * Constructs the ArticleView object.
     *
     * @param      {Object}  args    The arguments object
     */
    constructor(args) {
        super(args);

        this._widget = this.driver.box({
            'parent': this.screen,
            'scrollable': true,
            'alwaysScroll': true,
            'top': 0,
            'left': 0,
            // 'padding': 2,
            'border': 'line',
            'align': 'left',
            'tags': true,
            'keys': true,
            'width': '100%',
            'height': '100%',
            'vi': false,
            'mouse': false,
            'style': {
                'border': {
                    'fg': 'white'
                },
                'scrollbar': {
                    'bg': 'blue'
                }
            }
        });

        this._widget.focus();
    }

    /**
     * Set raw data and process it
     *
     * @param      {Object}  raw     The raw data
     */
    set raw(raw) {
        this._raw = raw;
        this._id = raw.data.id;
        this._subreddit = raw.data.subreddit;
        this._title = entities.decode(raw.data.title);
        this._author = raw.data.author;
        this._body = entities.decode(raw.data.selftext);
        this._createdAt = new Date((raw.data.created * 1000));
        this._content = `{red-fg}{bold}${this._title}{/bold}{/red-fg}\nby {yellow-fg}${this._author}{/yellow-fg} on ${this._createdAt}\n\n${this._body}`;
        this._widget.setContent(this._content);

        this.render();
    }

    /**
     * Set raw comments data and process it
     *
     * @param      {Object}  raw     The raw comments data
     */
    set rawComments(raw) {
        this._rawComments = raw;
        this.loadComments(this._id);

        this.render();
    }

    /**
     * Loads comments / triggers comment-structuring
     *
     * @return     {boolean}  True
     */
    loadComments() {
        const commentsContent = this.buildCommentsStructure(this._rawComments);

        this._content += `\n---\n\n${commentsContent}`;
        this._widget.setContent(this._content);

        return true;
    }

    /**
     * Builds the comments structure
     *
     * @param      {Object}  rawComments  The raw comments data
     * @param      {number}  level        The current level of "indentation"
     * @return     {string}  The structured comments
     */
    buildCommentsStructure(rawComments, level = 0) {
        let prefix = '{magenta-fg}={/magenta-fg}'.repeat(level);

        if(level > 0) {
            prefix += '{magenta-fg}>{/magenta-fg} ';
        }

        let content = '';

        _.forEach(rawComments, item => {
            if(item.kind === 't1') {
                const author = item.data.author;
                const body = _.trimEnd(_.trim(entities.decode(item.data.body)), '\n');
                const createdAt = new Date((item.data.created * 1000));
                let replies = null;

                if(item.data.hasOwnProperty('replies') === true
                && item.data.replies.hasOwnProperty('data') === true
                && item.data.replies.data.hasOwnProperty('children') === true) {
                    replies = this.buildCommentsStructure(item.data.replies.data.children, (level + 1));
                }

                content += `${prefix}{cyan-fg}{bold}${author}{/bold} on ${createdAt}{/cyan-fg}: ${body}\n\n`;
                if(replies !== null) {
                    content += `${replies}`;
                }
            }
        });

        return content;
    }
};
