function resetStyle() {
      $('div.has-success input.grayBorder').css('border-color', 'gray')
      $('span.glyphicon-ok').remove()
}
      
  //默认货币对
  var myChart = echarts.init(document.getElementById("chartMain"));
	var myChartContainer;
  var buyPendingBox = document.getElementById("buyPendingBox")
  var sellPendingBox = document.getElementById("sellPendingBox")
  var stompClient = null;
  var userId = null;

  function connect() {
      var socket = new SockJS('/websocket');
      stompClient = Stomp.over(socket);
      stompClient.connect({}, function(frame) {
          var sessionId = socket._transport.url.split("/")[5];
//               如果有userid
             if($.cookie('UserId')){
             	    $('#loginLi').html('<span>' + $.cookie('email') + '</span>')
                       $('#liLast').html('<span id="logout">Logout</span>')
                       $('#userItem').removeClass('hide')
                        //监听挂单数据
                        pendingOrders()
                        //监听删除订单返回数据
                       monitorDelOrder()
                       //监听历史订单数据
                        historyOrders()  
                      //监听币币可用余额数据
                      userAsserts()
                      
                      
             }
             
             //如果没有userID
            customValidate($('#lgPassWordForm'), {
                "lgEmail": {
                    required: true,
                    email: true
                },
                "lgPassword": {
                    required: true
                }
            }, {}, function() {
            	    
                stompClient.subscribe('/gateway/login-' + sessionId, function(data) {
                   	  // TODO store userId
                   	    
                      $.cookie('email',$('#lgEmail').val(),{expires: 7})
                      $.cookie('UserId',jQuery.parseJSON(data.body).UserID)
                      var status = jQuery.parseJSON(data.body).Status
                           
                      if (status == 0){
                    	$('#myModal').modal('hide')
                       $('#loginLi').html('<span>' + $.cookie('email') + '</span>')
                       $('#liLast').html('<span id="logout">Logout</span>')
                       
                         resetStyle()
                         $('#userItem').removeClass('hide')
                        } else if (status == -1) {
                        alert('login error!')
                                              }
                         //挂单
                        pendingOrders()
                        //监听删除订单
                       monitorDelOrder()
                       //历史订单
                        historyOrders()  
                      //币币可用余额
                      userAsserts()
               })
                sendLoginData() //login	
            })
                  $('#liLast').click(function() {   //logout
                  	 
                     sendLogoutData() //send logout Data
                     $.removeCookie('UserId')
                     $('#availableBalance_buy').text('')
                     $('#availableBalance_sell').text('')
                     $('#TradeCoinAvailable').text('')
                     $('#BaseCoinAvailable').text('')
//                   $('#iconMark').addClass('hide')
                     $('#loginLi').html('<a id="loginBtn" data-toggle="modal" data-target="#myModal"> Login </a>')
               $('.ulList li:last').html('<a href="Register.html">  Register  </a>')
                 $('#userItem').addClass('hide')
                 $('#openOrderTable').bootstrapTable('removeAll')
                 $('#historyOrderTable').bootstrapTable('removeAll')
                    
                                               })
          //货比对昨天今天以及最值
          stompClient.subscribe('/gateway/coinMarketSummary-' + sessionId, function(data) {
        	  var newData = jQuery.parseJSON(data.body)
              $('#currencyTextContent').text(newData.Symbol)
              $('#yesterdayTopData').text(newData.Yesterday.high) //最值
              $('#yesterdayBottomData').text(newData.Yesterday.low)
              $('#yesterdayOpenData').text(newData.Yesterday.open)
              $('#yesterdayVolumeData').text(newData.Yesterday.volume)
              $('#todayTopData').text(newData.Today.high)
              $('#todayBottomData').text(newData.Today.low)
              $('#todayOpenData').text(newData.Today.open)
              $('#todayVolumeData').text(newData.Today.volume)
              $('#newPrice').text(newData.Today.current)
          });
         
             //涨跌幅
           stompClient.subscribe('/gateway/coinMarket-' + sessionId, function(data) {
              var d = jQuery.parseJSON(data.body)
              $('#upDownList').html('')
              var upDownList = document.getElementById("upDownList")
              var currencyList = d.SymbolList
              var curArr = []
              $.each(currencyList, function(i, el){curArr.push(el.BaseCoin)})

              $.each(currencyList, function(i, el) {
              upDownList.innerHTML += '<li><span class="CurrencyCalculate">' + currencyList[i].Symbol + '</span><span  class="icon icon-Down-Round" data-UPDown=' + currencyList[i].UPDown + '></span></li>' //加载涨跌幅列表
              })
              $('#upDownList li ').each(function(i, el) { //遍历点击涨跌幅列表数据变化
              	    

	                $($(el).children('span:nth-child(1)')).click(function(e) {
	                	 
	                	  var   target=e.target||window.event.srcElement    
                    $('#dealText2').attr('data-Symbol',target.innerText)
                    $('#dealText4').attr('data-Symbol',target.innerText)
                    $(upDownList).html('')
                      $(buyPendingBox).html('')
                      $(sellPendingBox).html('')
                      var sendData = {tagText: $(target).text()}
                      var coinText = target.innerText.split('/')[0]
                      var basicCoin=target.innerText.split('/')[1]
                      $('#dealText1').text(coinText)
                      $('#dealText2').text(coinText)
                      $('#dealText3').text(basicCoin)
                      $('#dealText4').text(coinText)
                       $('.baseToken').text(basicCoin)
              	  $('.tradeToken').text(coinText)
                      $('#buyPriceText').attr('placeholder','Buy Price'+'('+ basicCoin+ '):')
                      $('#buyAmountText').attr('placeholder','Buy Amount'+'('+ coinText+ '):')
                        $('#sellPriceText').attr('placeholder','Sell Price'+'('+ basicCoin+ '):')
                      $('#sellAmountText').attr('placeholder','Sell Amount'+'('+ coinText+ '):')
                      $('#currencyTextContent').text(target.innerText)
                       
                      stompClient.send("/ws/token/home", {}, JSON.stringify({
                          "UserID":parseInt($.cookie('UserId')),
                           "Token":target.innerText,
                          "RequestID":RequestId
                      }));
                  })
              })
//            //涨跌标识符
              $.each($('.CurrencyCalculate'), function(i, el) {

                  if ($(el).next().attr('data-UPDown') > 0) {
                      $(el).next().addClass('icon-Up-Round').removeClass('icon-Down-Round')
                  }else if($(el).next().attr('data-UPDown') <0){
                  	   
                  	  $(el).next().addClass('icon-Down-Round')
                  }else if($(el).next().attr('data-UPDown') == 0){
                  	 
                  	  $(el).next().text('==').removeClass('icon icon-Down-Round').css('margin-right','5px')
                  }
              });
              //     表单买卖
              //     buy
                      validateTokenTrade($('#trade_buyForm'),function(){
          	          sendBuyData()
                      stompClient.subscribe('/gateway/order-' + sessionId, function(data) {
//                    	   alert("sessionId : " + sessionId);
                          var status = jQuery.parseJSON(data.body).Status

                             if(status == 0) {
                             	  alert('success')
                             	   window.location.reload()
                             }

                      })
                    
                      $('#trade_buyForm')[0].reset()
                       $('#buyTotal').text('')
                      resetStyle()
          })
            //sell
           validateTokenTrade($('#trade_sellForm'),function(){
           	    sendSellData()
                     stompClient.subscribe('/gateway/order-' + sessionId, function(data) {
                          var status = jQuery.parseJSON(data.body).Status
                          if(status == 0) {
                             	  alert('success')
                             	   window.location.reload()
                             }
                      })
                      
                      $('#trade_sellForm')[0].reset()
                      $('#sellTotal').text('')
                      resetStyle()
           })

          });
          // 订单簿
          stompClient.subscribe('/gateway/pendingOrders-' + sessionId, function(data) {
              var orderBook = jQuery.parseJSON(data.body).List
              //orderBook  buy
                if(orderBook.Buy!=undefined){
                	 $(buyPendingBox).html('')
                  for(var i=0;i<orderBook.Buy.length;i++){
                   	   if(orderBook.Buy[i].Price==0||orderBook.Buy[i].Amount==0){
                   	   	   orderBook.Buy.splice(i,1)
                   	   }
                   }
                  
                 
              $.each(orderBook.Buy, function(i, d) {
                  var buyOrderList = "<p><span class='buyPriceRow'>Buy<span class='buyPriceData'>" + d.Price + " </span></span><span class='orderBookAmount'>" + d.Amount + "</span></p>"
                  buyPendingBox.innerHTML += buyOrderList
              })
                }
              //orderBook sell
                if(orderBook.Sell!=undefined){
               	 $(sellPendingBox).html('')
               	 for(var i=0;i<orderBook.Sell.length;i++){
                   	   if(orderBook.Sell[i].Price==0||orderBook.Sell[i].Amount==0){
                   	   	   orderBook.Sell.splice(i,1)
                   	   }
                   }
               	$.each(orderBook.Sell, function(i, d) {
                  var sellOrderList = "<p><span class='sellPriceRow'>Sell<span class='sellPriceData'>" + d.Price + " </span></span><span class='orderBookAmount'>" + d.Amount + "</span></p>"
                  sellPendingBox.innerHTML += sellOrderList
              });
               }
              
          });
          
           // 个人pending order 挂单
           function pendingOrders(){
               stompClient.subscribe('/gateway/userPendingOrders-' + sessionId, function(data){
                    
          	  var pendingOrder = jQuery.parseJSON(data.body).SearchTradings
          	    newArr=$.each(pendingOrder,function(i ,el){
          	        
          	     pendingOrder[i].Time=timestampToTime(pendingOrder[i].Time)
          	     pendingOrder[i].Total=pendingOrder[i].Price*pendingOrder[i].Amount
          	      
          	         if(pendingOrder[i].OrderType==1){  
          	         	  pendingOrder[i].OrderType='market order'
          	         }else if(pendingOrder[i].OrderType==2){
          	         	   pendingOrder[i].OrderType='limit order'
          	         }
          	         if(pendingOrder[i].TransType==1){
          	         	    pendingOrder[i].TransType='Buy'
          	         }else if(pendingOrder[i].TransType==2){
          	         	   pendingOrder[i].TransType='Sell'
          	         }
          	         
          	        })
          	                      
                  $('#openOrderTable').bootstrapTable({
                  rowStyle: function(row, index) {
                      var style = {};
                      style = {
                          css: {
                              'text-align': 'center'
                                }
                               };
                      return style;
                  },
                  
                  striped:true,
                  pagination:'true',
                  pageSize:6,
                  columns: [{
                          field: 'OrderID',
                          title: 'Order ID'
                      }, {
                          field: 'Time',
                          title: 'Time'
                      }, {
                          field: 'Symbol',
                          title: 'Symbol'
                      }, {
                          field: 'OrderType',
                          title: 'Order Type'
                      }, 
                      {
                      	  field: 'TransType',
                          title: 'Trans Type'                       
                      },
                      {
                          field: 'Price',
                          title: 'Price'
                      }, {
                          field: 'Amount',
                          title: 'Amount'
                      }, 

                      {
                          field: 'Total',
                          title: 'Total'
                      },
                      {
                          field: 'Action',
                          title: 'Action'
                      }    

                  ],
                  data:pendingOrder,
                 
                  onPageChange:function(){
                  	  if(pendingOrder!=0){
               	$('#openOrderTable tbody tr').children("td:last-child").html('<button   class="deleteBtn" >Delete</button>')
               }
                  	  delOrder()
                  	  

                  }
                  
              });
               if(pendingOrder!=0){
               	$('#openOrderTable tbody tr').children("td:last-child").html('<button   class="deleteBtn" >Delete</button>')
               }
              delOrder()
          });
           	
           }
            // 历史订单
           function historyOrders(){
             	 stompClient.subscribe('/gateway/userHistoricalOrders-' + sessionId, function(data) {
         	    var historytableData =jQuery.parseJSON(data.body)
         	    
         	      $.each(historytableData.OrderList,function(i,el){
         	      	    
         	 if(historytableData.OrderList[i].ordertime==0){
         	 	 historytableData.OrderList[i].ordertime=0
         	 }else{
         	 	historytableData.OrderList[i].ordertime=timestampToTime(historytableData.OrderList[i].ordertime)
         	 }
         	  if(historytableData.OrderList[i].lasttradertime==0){
         	  	historytableData.OrderList[i].lasttradertime=0
         	  }else{
         	  	historytableData.OrderList[i].lasttradertime=timestampToTime(historytableData.OrderList[i].lasttradertime)
         	  }
         	  
           	 if(historytableData.OrderList[i].canceltime==0){
         	 	historytableData.OrderList[i].canceltime=0
         	 }else{
         	 	historytableData.OrderList[i].canceltime=timestampToTime(historytableData.OrderList[i].canceltime)
         	 }
         	           	           	  
         	  if(historytableData.OrderList[i].Transtype==1){
         	  	historytableData.OrderList[i].Transtype='Buy'
         	  }else if(historytableData.OrderList[i].Transtype==2){
         	  	historytableData.OrderList[i].Transtype='Sell'
         	  }
         	  
         	  
         	    
         	  if(historytableData.OrderList[i].status==0){
         	  	   historytableData.OrderList[i].status='Completed'
         	  }else if(historytableData.OrderList[i].status==3){
         	  	  historytableData.OrderList[i].status='Canceled'
         	  }
         	      })
         	    
              $('#historyOrderTable').bootstrapTable({
                  rowStyle: function(row, index) {
                      var style = {};
                      style = {
                          css: {
                              'text-align': 'center'
                          }
                      };
                      return style;
                  },
                  striped:true,
                  pagination:'true',
                  pageSize:6,
                  columns: [{
                          field: 'id',
                          title: 'ID'
                      }, 
                       {
                       	field: 'Symbol',
                          title: 'Symbol'
                       },
                      {
                          field: 'Transtype',
                          title: 'Trans Type'
                      },{
                          field: 'price',
                          title: 'Price'
                      },
                      {
                           field: 'amount',
                          title: 'Amount'
                      },
                      {
                          field: 'tradeamount',
                          title: 'Trade Amount'
                      },
                      
                      {
                           field: 'ordertime',
                          title: 'Order Time'
                      },
                      {
                      	field: 'lasttradertime',
                          title: 'Last Traded Time'
                      },
                      {
                      	field: 'canceltime',
                          title: 'Cancel Time'
                      } ,{
                          field: 'status',
                          title: 'Status'
                      }
                      ],
                  data: historytableData.OrderList
                 });
                 });
             }
           //币币可用余额
           function userAsserts(){
             	  stompClient.subscribe('/gateway/tokenAssets-' + sessionId, function(data) {
             	  	$('#iconMark').removeClass('hide') //货币对斜杠显示
              var d = jQuery.parseJSON(data.body)
              var blanceArr = d.CoinBalance
              $.each(blanceArr, function(i, el) {
              	   
              	  $('#dealText1').text(el.TradeCoin)
              	  $('#dealText2').text(el.TradeCoin)
              	  $('#dealText4').text(el.TradeCoin)
              	  $('#dealText3').text(el.BaseCoin)
              	  $('.baseToken').text(el.BaseCoin)
              	  $('.tradeToken').text(el.TradeCoin)
                  $('#TradeCoinAvailable').text(el.TradeCoinAvailable)
                  $('#rangeMaxNumber').text(el.Available)
                  $('#BaseCoinAvailable').text(el.BaseCoinAvailable)
                  $("#buySlide").slider({
                      tooltip: 'always',
                      min: 0,
                      max: 100
                  });
                  $("#sellSlide").slider({
                      tooltip: 'always',
                      min: 0,
                      max:100
                  });
              });
              function buyTotal(){
 $('#buyTotal').text(Number($('#buyPriceText').val())*Number($('#buyAmountText').val()))
              }
              function sellTotal(){
 $('#sellTotal').text(Number($('#sellPriceText').val())*Number($('#sellAmountText').val()))
              }
              //buy 计算总数
                $('#buyPriceText').blur(function(){
                                    buyTotal()
                                         })
               $('#buyAmountText').blur(function(){
                                  buyTotal()
                                        })
               
               $('.slider-handle.min-slider-handle.round').eq(0).mouseup(function(){
        $('#buyAmountText').val($('#buySlide').val()*$('#TradeCoinAvailable').text()/100)
                                   buyTotal()
                  })
               //sell 计算总数
               $('#sellPriceText').blur(function(){
                                    sellTotal()
                                         })
               $('#sellAmountText').blur(function(){
                                  sellTotal()
                                        })
               
               $('.slider-handle.min-slider-handle.round').eq(1).mouseup(function(){
       $('#sellAmountText').val($('#sellSlide').val()*$('#TradeCoinAvailable').text()/100)
                                   sellTotal()
                 })
               });
             }
          //交易密码错误   
             stompClient.subscribe('/gateway/orderFailByTransPwd-' + sessionId, function(data){
             	   var status = jQuery.parseJSON(data.body).Status
             	      if (status == -1) {
                              alert('not sufficient funds')
                          } else if (status == -2) {
                              alert('PASSWORD ERROR')
                          } else if (status == -3) {
                              alert('misplaced else')
                          }
            })
          
          // 历史行情
          stompClient.subscribe('/gateway/historicalBars-' + sessionId, function(data) {
				var newData = jQuery.parseJSON(data.body);// 解析数据
				var history = newData.MarketHistory;
				var data = new Array();
				for (var i = 0; i < history.length; i++) {
					data[i] = new Array(i);
					for (var j = 0; j < 5; j++) {
						data[i][0] = history[i]['startTime'];
						data[i][1] = history[i]['open'];
						data[i][2] = history[i]['close'];
						data[i][3] = history[i]['high'];
						data[i][4] = history[i]['low'];
					}
				}
				var data0 = splitData(data);
				option = {// echarts配置
					title : {text : '',left : 0},
					tooltip : {trigger : 'axis',axisPointer : {type : 'line'}},
					legend : {data : ['K Line']},
					grid : {left : '10%',right : '10%',top : '10%',bottom : '25%'},
					xAxis : {
						type : 'category',data : data0.categoryData,
						scale : true,
						boundaryGap : false,
						axisLine : {onZero : false},
						splitLine : {show : false},
						splitNumber : 20,min : 'dataMin',max : 'dataMax'},
					yAxis : {scale : true,splitArea : {show : true}},
					dataZoom : [ 
					{type : 'inside',start : 20,end : 80,top : 200},
					{show : true,type : 'slider',y : '90%',xAxisIndex: [0],start : 50,end : 100,top : 300}
					          ],
					series : [ 
					 {
						name : 'K Line',
						type : 'candlestick',
						data : data0.values,
						itemStyle :{
									normal : {
										color : 'lightgreen',
										color0 : 'red',
										lineStyle : {width : 1,color : 'lightgreen',color0 : 'red'}
									         }
                       },
					  }
					          ]
				};
				myChart.setOption(option);
				window.onresize = function () {myChart.resize();}
			});
          init()
           //
          $('.coins').click(function(e){
          	  var token=$.trim($(e.target).text())

              $(upDownList).html('')
              $(buyPendingBox).html('')
              $(sellPendingBox).html('')
              stompClient.send("/ws/token/reportService", {}, JSON.stringify({
              	  "Tag":24583,
                  "RequestID":RequestId,
                  "Symbol": token 
              }));
          	   
          })
          function init() {
              stompClient.send("/ws/token/home", {}, JSON.stringify({ //打开页面时候发送的数据
              	   
                  "UserID": parseInt($.cookie('UserId')),
                  "RequestID":RequestId,
                  "Token": null
              }));
          }
          function sendBuyData(){
              stompClient.send("/ws/token/trade", {}, JSON.stringify({ 
                  "Tag": 12289,
                  "UserID": parseInt($.cookie('UserId')),
                  "TradePwd": $('#buyPassword').val(),
                  "Symbol": $('#dealText2').attr('data-Symbol'),
                  "OrderType": 2,
                  "TransType": 1,
                  "OrderNumber": Number($('#buyAmountText').val()).toFixed(5),
                  "Price": Number($('#buyPriceText').val()).toFixed(5),
                  "RequestID":RequestId
              }));
          }
          function sendSellData() {
              stompClient.send("/ws/token/trade", {}, JSON.stringify({ 
                  "Tag": 12289,
                  "UserID": parseInt($.cookie('UserId')),
                  "TradePwd": $('#sellPassword').val(),
                  "Symbol": $('#dealText2').attr('data-Symbol'),
                  "OrderType": 2,
                  "TransType": 2,
                  "OrderNumber": Number($('#sellAmountText').val()).toFixed(5),
                  "Price": Number($('#sellPriceText').val()).toFixed(5),
                  "RequestID":RequestId
              }));
          }
          function delOrder(){
          	    $('.deleteBtn').click(function(e){  //删除订单
                 	 
                 	    $('#cancelModal').modal('show')
                        
                      $('#cancelBtn').click(function(){
                      	  $('#cancelModal').modal('hide')
                      	     
                      	  stompClient.send("/ws/token/cancelPendingOrder", {}, JSON.stringify({
                 	      	"Tag":16385,
							"UserID":parseInt($.cookie('UserId')),
							"OrderID": $(e.target).parents('tr').find('td').eq(0).text(),    
							"RequestID":RequestId
                 	      }))
                      })
                 })
          }
          //监听删除订单
           function monitorDelOrder(){
           	stompClient.subscribe('/gateway/cancelOrder-' + sessionId, function(data){
          	     
          	    var cancelData=jQuery.parseJSON(data.body)
          })
           }
          
          function sendLoginData() {
              stompClient.send("/ws/user/login", {}, JSON.stringify({ //login
                  "Tag": 8193,
                  "username": $('#lgEmail').val(),
                  "loginpassword": $('#lgPassword').val(),
                  "srcip": "192.168.0.1",
                  "UserID" : parseInt($.cookie('UserId')),
                  "RequestID":RequestId
              }));
          }
          function sendLogoutData() {
              stompClient.send("/ws/user/logout", {}, JSON.stringify({ //logout
                  "Tag": 131089,
                  "UserID" : parseInt($.cookie('UserId')),
                  "srcip": "192.168.0.1",
                  "RequestID":RequestId
              }));
          }
            
                  
      });

  }
     connect();   
        
       function splitData(rawData){ 
		var categoryData = [];
		var values = []
		for (var i = 0; i < rawData.length; i++) {
			categoryData.push(rawData[i].splice(0, 1)[0]);
			values.push(rawData[i])
		}
		return {
			categoryData:categoryData,
			values:values
		};
	}
      /*** timeframe切换事件*/
	getTimeFrame = function(time) {
		symbol = $("#currencyTextContent").html();

		stompClient.send("/ws/token/reportService", {}, JSON.stringify({
			'Tag':24601,
			"SessionID":"abcdefg",
			"WSID":1,
			"RequestID" :RequestId,
			'Symbol' : symbol,
			"Timeframe" : time
		}));

	}
	  
	   $('#selectTime li').click(function(e){
	   	    
	   	
               	   if(e.target.innerText=='1M'){
               	   	  getTimeFrame(M1)
               	   }else if(e.target.innerText=='5M'){
               	   	getTimeFrame(M5)
               	   }else if(e.target.innerText=='15M'){
               	   	getTimeFrame(M15)
               	   }else if(e.target.innerText=='30M'){
               	   	getTimeFrame(M30)
               	   }else if(e.target.innerText=='1H'){
               	   	getTimeFrame(H1)
               	   }else if(e.target.innerText=='4H'){
               	   	getTimeFrame(H4)
               	   }else if(e.target.innerText=='12H'){
               	   	getTimeFrame(H12)
               	   }else if(e.target.innerText=='1D'){
               	   	getTimeFrame(D1)
               	   }else if(e.target.innerText=='1W'){
               	   	getTimeFrame(W1)
               	   }else if(e.target.innerText=='MN'){
               	   	getTimeFrame(MN)
               	   }
               	  
               	  
               })
	
	

      