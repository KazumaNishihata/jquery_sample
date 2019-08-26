// python -m SimpleHTTPServer 8888
const API_KEY = 'XXX'
const REQUEST_URL = 'https://api.flickr.com/services/rest'

const app = {
  data: {
    pathname:'',
    params:{},
    index:{
      keyword: 'cat',
      page:1,
      maxPage:1,
      items:[],
      suggest:[],
      suggestKey:-1
    },
    detail:{
      item:{}
    }
  },
  init: function() {
		this.bindEvent();
    this.pageInit();
  },
  pageInit: function(){
    this.setInitialize();
    if(this.data.pathname === "index" ){
      this.fetchIndexData()
    }else if(this.data.pathname === "detail"){
      this.fetchDetailData()
    }
  },
  setInitialize: function(){
    const path = location.pathname.split("/");
    this.data.pathname = path[path.length - 1].split('.')[0] || "index";
    this.data.params = {}
    const self = this
    location.search.slice(1).split("&").forEach(function(param){
      const _param = param.split("=")
      self.data.params[_param[0]] = _param[1];
    })
  },
	bindEvent: function() {
    $(window).on('popstate',this.pageInit.bind(this));
		// 検索
		$('.js-searchTrigger').click(this.handleSearch.bind(this))
		// ページ変更
		$(document).on('click','.js-triggerPageChange',this.handlePageChange.bind(this))
		// サジェスト
		$('.js-text')
			.focus(this.showSuggest.bind(this))
			.keyup(this.handleSuggest.bind(this))
			.blur(this.hideSuggest.bind(this))
    $(document).on('mousedown','.js-suggestTrigger',this.handleSuggestClickSearch.bind(this))
    // 詳細へ遷移
    $(document).on('click','.js-link',this.handleLink.bind(this))
	},
	// 検索
	handleSearch: function () {
		const keyword = $('.js-text').val()
		this.data.index = {
			keyword: keyword,
			page:1,
			maxPage:1,
			suggest: [keyword].concat(this.data.index.suggest),
			suggestKey:-1
		}
		this.fetchIndexData()
	},
	// ページ変更
	handlePageChange: function (e) {
		this.data.index.page = parseInt($(e.currentTarget).text(),10)
		this.fetchIndexData()
	},
	// サジェストを表示
	showSuggest: function () {
		this.renderSuggest()
		$('.js-suggestList').show()
	},
	// サジェストを非表示
	hideSuggest: function () {
		$('.js-suggestList').hide()
	},
	// キーボード入力持にサジェストの状態を返納
	handleSuggest: function (e) {
		// 上キーが押された場合(選択を変更)
		if(e.keyCode === 38 && this.data.index.suggestKey > -1){
			this.data.index.suggestKey -= 1
		// 下キーが押された場合(選択を変更)
		}else if(e.keyCode === 40 && this.data.index.suggestKey < this.data.index.suggest.length){
			this.data.suggestKey += 1
		// Enterが押された場合(検索)
		}else if(e.keyCode === 13 && this.data.index.suggestKey !== -1){
			const keyword = $(".js-suggestList .is-selected").text()
			this.searchKeyword(keyword)
			this.hideSuggest()
			return
		}else{
			this.data.index.suggestKey = -1
		}
		this.renderSuggest()
	},
	// サジェストリストが押下された場合の処理
	handleSuggestClickSearch: function (e) {
		const keyword = $(e.currentTarget).text()
		this.searchKeyword(keyword)
  },
  handleLink: function (e) {
    e.preventDefault()
    history.pushState(null,null,e.currentTarget.href)
    this.pageInit();
  },
	// 指定したキーワードで検索
	searchKeyword:function(keyword){
		$('.js-text').val(keyword)
		this.data.index = {
			keyword: keyword,
			page:1,
			maxPage:1,
			suggest: this.data.index.suggest,
			suggestKey:-1
		}
		this.fetchIndexData()
  },
	// API叩いて情報をとってくる(index)
	fetchIndexData: function () {
		const self = this;
		$.ajax({
				url: REQUEST_URL,
				type:'GET',
				data: {
					'method': 'flickr.photos.search',
					'api_key': API_KEY,
					'text':this.data.index.keyword,
					'page':this.data.index.page,
					'per_page': '10',
					'format': 'json',
					'nojsoncallback': '1',
					'extras':'url_s'
				}
			})
			.then(function(response){ 
				self.data.index.maxPage = response.photos.pages
				self.data.index.items =response.photos.photo
				self.renderIndex()
			})
  },
  // API叩いて情報をとってくる(index)
	fetchDetailData: function () {
		const self = this;
		$.ajax({
				url: REQUEST_URL,
				type:'GET',
				data: {
          method: "flickr.photos.getInfo",
          api_key: API_KEY,
          photo_id: self.data.params.id,
          format: "json",
          nojsoncallback: "1",
          extras: "url_s"
				}
			})
			.then(function(response){ 
				self.data.detail.item = response.photo
				self.renderDetail()
			})
  },
  pageRender: function () {
    $("[class^='js-page']").hide()
    $("[class='js-page-"+this.data.pathname+"']").show()
  },
	renderIndex(){
    this.pageRender()
		this.renderGallery()
		this.renderPager()
	},
	renderDetail(){
    this.pageRender()
    const url = "https://farm" + this.data.detail.item.farm + ".staticflickr.com/" +this.data.detail.item.server+ "/" +this.data.detail.item.id+ "_" + this.data.detail.item.secret + ".jpg"
    const html = '<img src="'+url+'" alt="">' +
                 '<p>' + this.data.detail.item.title._content + '</p>'
    $(".js-detail").html(html)
  },
	renderGallery(){
		const list = this.data.index.items.map(function(item){
			return '<li>' +
						 	'<a class="js-link" href="detail.html?id=' + item.id + '"><img src="' + item.url_s + '" alt="' + item.title + '"></a>' +
						 '</li>'

		})
		$('.js-searchList').html(list.join(''))
	},
	renderPager(){
		const range = 3
		const minRange = this.data.index.page > range ? this.data.index.page - range : 1
		const maxRange = this.data.index.maxPage < this.data.index.page + range ? this.data.index.maxPage : this.data.index.page + range
		const pager = []
		for(let i = minRange; i <= maxRange ; i++){
			if(i === this.data.index.page ){
				pager.push('<button aria-selected="true">'+ i +'</button>')
			}else{
				pager.push('<button class="js-triggerPageChange">'+ i +'</button>')
			}
		}
		$('.js-pageList').html(pager.join(''))
	},
	renderSuggest(){
		const self = this;
		const list = this.data.index.suggest.filter(function(text){
			return text.indexOf($('.js-text').val()) !== -1
		}).map(function(text,i){
			const className = i === self.data.index.suggestKey ? "is-selected" : ""
			return '<li class="js-suggestTrigger '+className+'">' + text + '</li>'
		})
		$('.js-suggestList').html(list.join(''))
	}
  
}
app.init()
