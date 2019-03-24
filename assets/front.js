(function($) {
	$.dbtpBooking = function(config) {

		var self = this;
		self.setup = function(config) {
			self.config = config;
			self.$app = $('#'+ self.config.containerId);

			self.reset();

			// get state from local storage or use default
			self.state = typeof(self.config.state) === 'object' && typeof(self.config.state.step) !== 'undefined' ? self.config.state : self.getState();
			// override state
			self.state = {step: 'services'};
		};
		self.reset = function() {
			self.location = {};
			self.treatments = {};
			self.packages = {};
			self.slots = {};
			self.customer = {};
			self.initialized = false;

			self.selectedTreatmentIds = [];
			self.selectedPackageIds = [];
			self.priceTotal = 0;
			self.fromDateTime = '';
			self.fromDate = '';
			self.toDate = '';
			self.slotId = '';
		};
		self.init = function() {
			self.appBlock();

			self.$app.addClass('dbtp-loading');
			self.initActions();


			self.loadLocation()
			.then(function(){
				self.initialized = true;

				self.appUnblock();
				self.$app.removeClass('dbtp-loading').addClass('dbtp-loaded');

				self.load_step();
			})
			.catch(function(error){
				self.appUnblock();
				self.$app.removeClass('dbtp-loading').addClass('dbtp-cant-load');
				self.$app.find('.dbtp-step-splash h2').html(error).addClass('dbtp-error');
			});
		};
		self.getWeekdayName = function(d){
			return self.config.strings.weekDayNamesShort[d.getDay()];
		};
		self.getMonthName = function(d){
			return self.config.strings.monthNamesLong[d.getMonth()];
		};
		self.getSelectedSlot = function(){
			return _.find(self.slots.all, function(slot){
				return slot.id == self.slotId;
			});
		};
		self.getTimeZone = function(d) {
			var offset = d.getTimezoneOffset(), o = Math.abs(offset);
			return (offset < 0 ? "+" : "-") + ("00" + Math.floor(o / 60)).slice(-2) + ":" + ("00" + (o % 60)).slice(-2);
		};
		self.initActions = function(){
			self.$app.on('click', '.dbtp-notification', function(){
				self.$app.removeClass('dbtp-notification-enabled dbtp-notification-toggle');
				if (typeof(self.notificationTimeout) === 'number') {
					clearTimeout(self.notificationTimeout);
					self.notificationTimeout = null;
				}
			});
			self.$app.find('.dbtp-step-wrap').css('min-height', $(window).height() - 200);

			self.$app.on('click', '.dbtp-close-modal', function(){
				self.load_step_services();
				return false;
			});
		};
		self.loadLocation = function(){
			return new Promise(function(resolve, reject){
				$.ajax({
					url: self.config.apiUrl,
					method: 'GET',
					success: function(r){
						if (r.success === true) {
							self.location = r.location;
							resolve(true);
						} else {
							reject(self.config.strings.locationInvalid);
						}
					},
					error: function(){
						reject(self.config.strings.locationInvalid);
					}
				});
			});
		};
		self.loadLocationTreatments = function(){
			return new Promise(function(resolve, reject){
				$.ajax({
					url: self.config.apiUrl + 'treatments',
					method: 'GET',
					success: function(r){
						if (r.success === true) {
							self.treatments = r.treatments;
							resolve(true);
						} else {
							reject(self.config.strings.treatmentsInvalid);
						}
					},
					error: function(){
						reject(self.config.strings.treatmentsInvalid);
					}
				});
			});
		};
		self.loadLocationPackages = function(){
			return new Promise(function(resolve, reject){
				$.ajax({
					url: self.config.apiUrl + 'packages',
					method: 'GET',
					success: function(r){
						if (r.success === true) {
							self.packages = r.packages;
							resolve(true);
						} else {
							reject(self.config.strings.packagesInvalid);
						}
					},
					error: function(){
						reject(self.config.strings.packagesInvalid);
					}
				});
			});
		};
		self.loadDates = function(){
			return new Promise(function(resolve, reject){
				$.ajax({
					url: self.config.apiUrl + 'dates',
					method: 'GET',
					data: {
						fromDateTime	: self.fromDate,
						toDateTime		: self.toDate,
						treatmentIds	: self.selectedTreatmentIds,
						packageIds		: self.selectedPackageIds
					},
					success: function(r){
						if (r.success === true) {
							self.dates = r.dates;
							resolve(true);
						} else {
							reject('No dates');
						}
					},
					error: function(){
						reject('No dates');
					}
				});
			});
		};
		self.api = function(path, method, data) {
			// convert formdata to js object
			if (typeof(data) === 'string') {
				data = formdataToObject(data);
			} else if (typeof(data) !== 'undefined' && typeof(data) !== 'object') {
				data = JSON.parse(data);
			} else if (! data) {
				data = {};
			}

			var uri = self.config.apiUrl + path;
			var request = $.ajax({
				method: method,
				url: uri,
				data: data
			});

			return request;
		};
		self.load_step = function(){
			if (self.state.step === 'services') {
				self.load_step_services();
			} else if (self.state.step === 'date') {
				self.load_step_date();
			} else if (self.state.step === 'slots') {
				self.load_step_slots();
			} else if (self.state.step === 'customer') {
				self.load_step_customer();
			} else if (self.state.step === 'confirmation') {
				self.load_step_confirmation();
			}
		};

		self.servicesFooterPosition = function(){
			var wsTop = $(window).scrollTop(), 
				wHeight = $(window).height(), 
				appTop = self.$app.offset().top, 
				appHeight = self.$app.height();

			if (! self.$app.hasClass('dbtp-current-step-services')) {
				$('.dbtp-step-services .dbtp-footer').removeClass('dbtp-stuck');
				return false;
			}

			if (wsTop > appTop + appHeight + 50) {
				$('.dbtp-step-services .dbtp-footer').removeClass('dbtp-stuck');
			} else if (wsTop > appTop + appHeight - wHeight + 50) {
				$('.dbtp-step-services .dbtp-footer').removeClass('dbtp-stuck');
			} else if (wsTop > appTop - 250) {
				$('.dbtp-step-services .dbtp-footer').addClass('dbtp-stuck');
			} else if (wsTop < appTop - 300) {
				$('.dbtp-step-services .dbtp-footer').removeClass('dbtp-stuck');
			}
		};
		self.renderTreatmentsTemplate = function(){
			var treatmentsTemplate = $('#dbtp-treatments-template').html(), treatmentsHtml;
			Mustache.parse(treatmentsTemplate);
			treatmentsHtml = Mustache.render(treatmentsTemplate, {treatments: self.treatments});
			self.$app.find('#dbtp-treatments-list').html(treatmentsHtml).show();
		};
		self.renderPackagesTemplate = function(){
			var packagesTemplate = $('#dbtp-packages-template').html(), packagesHtml;
			Mustache.parse(packagesTemplate);
			packagesHtml = Mustache.render(packagesTemplate, {packages: self.packages});
			self.$app.find('#dbtp-packages-list').html(packagesHtml).show();
		};
		self.updateServicesFooterTemplate = function(){
			var servicesFooterTemplate = $('#dbtp-services-footer').html(), treatmentsFooterHtml;
			if (self.selectedTreatmentIds.length > 0 || self.selectedPackageIds.length > 0) {
				Mustache.parse(servicesFooterTemplate);
				servicesFooterHtml = Mustache.render(servicesFooterTemplate, {
					packagesCount: self.selectedPackageIds.length,
					treatmentsCount: self.selectedTreatmentIds.length,
					packagesOnly: self.selectedPackageIds.length > 0 && self.selectedTreatmentIds.length === 0,
					treatmentsOnly: self.selectedTreatmentIds.length > 0 && self.selectedPackageIds.length === 0,
					packagesAndTreatments: self.selectedTreatmentIds.length > 0 && self.selectedPackageIds.length > 0,
					priceTotal: self.priceTotal
				});
				self.$app.find('.dbtp-step-services .dbtp-footer-inner').html(servicesFooterHtml).show();
			} else {
				self.$app.find('.dbtp-step-services .dbtp-footer-inner').hide();
			}
		};
		self.load_step_services = function(){
			// intialize actions
			if (! self.$app.data('services_step_actions_initialized')) {
				self.step_services_actions();
				self.$app.data('services_step_actions_initialized', true);
			}

			self.state.step = 'services';
			self.stateChanged();
			self.showStep(self.state.step);
		};
		self.step_services_actions = function(){
			self.loadLocationTreatments().then(self.renderTreatmentsTemplate);
			self.loadLocationPackages().then(self.renderPackagesTemplate);

			$(window).on('scroll', self.servicesFooterPosition);


			var serviceChanged = function(){
				self.priceTotal = 0;
				var treatment, package;
				
				self.selectedTreatmentIds = [];
				if (self.$app.find('.dbtp-treatment-item.dbtp-selected').length > 0) {
					self.$app.find('.dbtp-treatment-item.dbtp-selected').each(function(){
						treatmentId = $(this).data('value');
						treatment = _.find(self.treatments, function(t){
							return t.id == treatmentId;
						});
						self.priceTotal += treatment.price;

						self.selectedTreatmentIds.push(parseInt($(this).data('value'), 10));
					});
				}

				self.selectedPackageIds = [];
				if (self.$app.find('.dbtp-package-item.dbtp-selected').length > 0) {
					self.$app.find('.dbtp-package-item.dbtp-selected').each(function(){
						packageId = $(this).data('value');
						self.selectedPackageIds.push(parseInt($(this).data('value'), 10));

						package = _.find(self.packages, function(p){
							return p.id == packageId;
						});
						self.priceTotal += package.price;
					});
				}
				self.updateServicesFooterTemplate();
			};

			// treatments changed
			self.$app.on('treatment_changed', function(){
				serviceChanged();
			});

			// packages changed
			self.$app.on('package_changed', function(){
				serviceChanged();
			});

			self.$app.on('click', '.dbtp-treatment-item', function(){
				$(this).toggleClass('dbtp-selected');
				self.$app.trigger('treatment_changed');
				return false;
			});

			self.$app.on('click', '.dbtp-package-item', function(){
				$(this).toggleClass('dbtp-selected');
				self.$app.trigger('package_changed');
				return false;
			});

			self.$app.on('click', '.dbtp-step-services .dbtp-next-btn', function(){
				self.fromDate = getDateToday();
				self.toDate = getDateAfter(self.location.settings.advance_days || 60);
				// self.toDate = getLastDateOfMonth(self.fromDate.substr(0,4), self.fromDate.substr(5,2)-1);
				

				self.$app.find('.dbtp-step-services .dbtp-next-btn').attr('disabled', 'disabled').addClass('dbtp-loading');
				
				self.loadDates()
				.then(function(){
					self.$app.find('.dbtp-step-services .dbtp-next-btn').removeAttr('disabled').removeClass('dbtp-loading');
					self.$app.find('.dbtp-step-services .dbtp-footer').removeClass('dbtp-stuck');
					self.$app.trigger('dates_loaded');
					self.load_step_date();
				});

				//self.$app.find('.dbtp-step-services .dbtp-footer').removeClass('dbtp-stuck');
				//self.$app.trigger('dates_loaded');
				//self.load_step_date();

				return false;
			});
		};
		

		self.load_step_date = function(){
			self.$app.find('.dbtp-step-date .dbtp-step-form').show();
			self.$app.find('.dbtp-step-date .dbtp-step-instruction').removeClass('dbtp-error');

			if (! self.$app.data('date_step_actions_initialized')) {
				self.step_date_actions();
				self.$app.data('date_step_actions_initialized', true);
			}

			self.state.step = 'date';
			self.stateChanged();
			self.showStep(self.state.step);
		};
		self.step_date_actions = function(){
			self.$app.on('date_changed', function(){
				if (self.fromDateTime) {
					self.$app.find('.dbtp-step-date .dbtp-next-btn').removeAttr('disabled').removeClass('dbtp-disabled');
				}
			});

			self.$app.on('change', '#dbtp-date-input', function(){
				var d = new Date($(this).val());

				self.fromDateTime = d.getFullYear() +
				'-' + (d.getMonth() < 9 ? '0'+ (d.getMonth()+1) : (d.getMonth()+1)) +
				'-' + (d.getDate() < 10 ? '0'+ d.getDate() : d.getDate()) + 
				'T00:00:00'+ self.location.timezone;

				self.$app.trigger('date_changed');
			});

			self.$app.on('dates_loaded', function(){
				$('#dbtp-date-input').datepicker({
					inline	: true,
					minDate	: self.dates.length > 0 ? new Date(self.dates[0].date) : 0,
					maxDate	: self.dates.length > 0 ? new Date(self.dates[self.dates.length-1].date) : 0,
					dayNamesMin: self.config.strings.weekDayNamesShort
				});
				if (self.dates.length > 0) {
					$('#dbtp-date-input').datepicker("setDate", new Date(self.dates[0].date)).trigger('change');
				}

				// disable unavailable dates
				$('#dbtp-date-input').datepicker("option", 'beforeShowDay', function(date){
					var ymd = date.getFullYear() + "-" + ("0"+(date.getMonth()+1)).slice(-2) + "-" + ("0"+date.getDate()).slice(-2);
					var find = _.find(self.dates, function(d){
						return d.date == ymd;
					});

					if (find) {
						return [true, "enabled", "Book Now"];
					} else {
						return [false,"disabled", "Unavailable"];
					}
				});
			});

			self.$app.on('click', '.dbtp-step-date .dbtp-prev-btn', function(){
				self.load_step_services();
				return false;
			});

			self.$app.on('click', '.dbtp-step-date .dbtp-next-btn', function(){
				self.$app.find('.dbtp-step-date .dbtp-next-btn').attr('disabled', 'disabled').addClass('dbtp-loading');

				self.api('slots', 'GET', {
					fromDateTime: self.fromDateTime,
					treatmentIds: self.selectedTreatmentIds,
					packageIds	: self.selectedPackageIds
				})
				.done(function(r){
					self.$app.find('.dbtp-step-date .dbtp-next-btn').removeAttr('disabled').removeClass('dbtp-loading');

					if (r.success && r.slots.length > 0) {
						var slots = r.slots, d;
						self.slots = {
							morning 	: [],
							afternoon 	: [],
							evening 	: [],
							all			: r.slots
						};
						_.each(r.slots, function(slot){
							d = new Date(slot.timestamp * 1000);
							d.setTime(d.getTime() + d.getTimezoneOffset()*60*1000);

							if (d.getHours() < 12) {
								self.slots.morning.push(slot);
							} else if (d.getHours() < 17) {
								self.slots.afternoon.push(slot);
							} else {
								self.slots.evening.push(slot);
							}
						});
		
						self.$app.trigger('slots_loaded');
						self.load_step_slots();
					} else {
						self.notify(self.config.strings.slotsUnavailable, 'error');
					}
				});

				return false;
			});


			self.$app.trigger('dates_loaded');
		};

		self.load_step_slots = function(){
			self.$app.find('.dbtp-step-slots .dbtp-step-form').show();
			self.$app.find('.dbtp-step-slots .dbtp-step-instruction').removeClass('dbtp-error');

			if (! self.$app.data('slots_step_actions_initialized')) {
				self.step_slots_actions();
				self.$app.data('slots_step_actions_initialized', true);
			}

			self.state.step = 'slots';
			self.stateChanged();
			self.showStep(self.state.step);
		};
		self.step_slots_actions = function(){
			self.$app.on('slots_loaded', function(){
				var slotsTemplate = $('#dbtp-slots-template').html(), slotsHtml;
				Mustache.parse(slotsTemplate);
				slotsHtml = Mustache.render(slotsTemplate, {
					morning: self.slots.morning,
					afternoon: self.slots.afternoon,
					evening: self.slots.evening
				});
				self.$app.find('.dbtp-step-slots .dbtp-step-form').html(slotsHtml).show();
				self.$app.find('.dbtp-step-slots .dbtp-next-btn').attr('disabled', 'disabled').addClass('dbtp-disabled');

				if ($('#dbtp-slots-footer-note-template').length > 0) {
					if (self.location.phone) {
						var slotsFooterNoteTemplate = $('#dbtp-slots-footer-note-template').html(), slotsFooterNoteHtml;
						Mustache.parse(slotsFooterNoteTemplate);
						slotsFooterNoteHtml = Mustache.render(slotsFooterNoteTemplate, {
							phone: formatPhoneNumber(self.location.phone)
						});
						self.$app.find('.dbtp-step-slots .dbtp-footer-note').html(slotsFooterNoteHtml).show();
					} else {
						self.$app.find('.dbtp-step-slots .dbtp-footer-note').empty().hide();
					}
				}
			});

			self.$app.on('click', '.dbtp-slot-item', function(){
				$('.dbtp-slot-item').removeClass('dbtp-selected');
				$(this).toggleClass('dbtp-selected');

				self.slotId = parseInt($(this).data('value'), 10);
				self.$app.trigger('slot_changed');

				var slot = self.getSelectedSlot();
				//console.log(slot);

				return false;
			});

			self.$app.on('click', '.dbtp-step-slots .dbtp-prev-btn', function(){
				self.load_step_date();
				return false;
			});

			self.$app.on('click', '.dbtp-step-slots .dbtp-next-btn', function(){
				var treatments = [];
				var slot = self.getSelectedSlot();

				//self.appBlock();
				//self.notify('Reserving the slot for you', 'loading');

				self.$app.find('.dbtp-step-slots .dbtp-next-btn').attr('disabled', 'disabled').addClass('dbtp-loading');

				self.api('incomplete-appointment', 'POST', {
					guid: slot.guid,
					packageId: slot.packageId,
					datetime: slot.datetime,
					treatments: slot.treatments
				})
				.done(function(r){
					//console.log(r);

					self.$app.find('.dbtp-step-slots .dbtp-next-btn').removeAttr('disabled').removeClass('dbtp-loading');

					if (r.success) {
						self.incompleteAppointmentId = r.incomplete_appointment.id;

						// self.appUnblock();
						// self.notify('Slot reserved', 'success', 5000);
						
						self.load_step_customer();
					} else {
						// self.appUnblock();
						self.notify(r.message, 'error');
					}
					// self.load_step_customer();
				});
				return false;
			});

			self.$app.on('slot_changed', function(){
				if (self.slotId) {
					self.$app.find('.dbtp-step-slots .dbtp-next-btn').removeAttr('disabled').removeClass('dbtp-disabled');
				}
			});

			self.$app.trigger('slots_loaded');
		};

		self.load_step_customer = function(){
			self.$app.find('.dbtp-step-customer .dbtp-step-form').show();
			self.$app.find('.dbtp-step-customer .dbtp-step-instruction').removeClass('dbtp-error');

			if (! self.$app.data('customer_step_actions_initialized')) {
				self.step_customer_actions();
				self.$app.data('customer_step_actions_initialized', true);
			}

			self.state.step = 'customer';
			self.stateChanged();
			self.showStep(self.state.step);
		};
		self.step_customer_actions = function(){
			
			var validCustomerData = function(){
				var customerFields = $('.dbtp-step-customer .dbtp-step-form :input').serializeArray();
				var validData = true;
				// console.log(customerFields);
				_.each(customerFields, function(field, index){
					// console.log(field);
					if (! field.value) {
						validData = false;
					}
				});
				
				return validData;
			}

			self.$app.on('customer_loaded', function(){
				var customerSubheaderTemplate = $('#dbtp-customer-subheader-template').html(), customerSubheaderHtml;
				if (self.selectedTreatmentIds.length > 0 || self.selectedTreatmentIds.length > 0) {
					var slot = self.getSelectedSlot();

					console.log(slot.datetime);
					console.log(slot.datetime.substr(0, 19));

					var d = new Date(slot.datetime.substr(0, 19));
					// convert the time to gmt
					// d.setTime(d.getTime() + d.getTimezoneOffset()*60*1000);
					// convert the time to location timezone
					//d.setTime(d.getTime() + (self.location.timezone_offset*1000));
					//console.log(d.toString());
					// d.setTime(d.getTime() + d.getTimezoneOffset()*60*1000);
					
					var dateStr = self.getWeekdayName(d) + ' '+ d.getDate() +' ' + self.getMonthName(d);
					var meridiem = d.getHours() >= 12 ? "PM" : "AM";
					var timeStr = ((d.getHours() + 11) % 12 + 1);
					if (d.getMinutes() > 0) {
						 timeStr += ":" + d.getMinutes();
					}
					timeStr += ' ' + meridiem;

					Mustache.parse(customerSubheaderTemplate);
					customerSubheaderHtml = Mustache.render(customerSubheaderTemplate, {
						packagesCount: self.selectedPackageIds.length,
						treatmentsCount: self.selectedTreatmentIds.length,
						packagesOnly: self.selectedPackageIds.length > 0 && self.selectedTreatmentIds.length === 0,
						treatmentsOnly: self.selectedTreatmentIds.length > 0 && self.selectedPackageIds.length === 0,
						packagesAndTreatments: self.selectedTreatmentIds.length > 0 && self.selectedPackageIds.length > 0,
						priceTotal: self.priceTotal,
						dateStr: dateStr,
						timeStr: timeStr
					});
					self.$app.find('.dbtp-step-customer .dbtp-subheader').html(customerSubheaderHtml).show();
				} else {
					self.$app.find('.dbtp-step-customer .dbtp-subheader').hide();
				}


				if (validCustomerData()) {
					self.$app.find('.dbtp-step-customer .dbtp-next-btn').removeAttr('disabled').removeClass('dbtp-disabled');
				} else {
					self.$app.find('.dbtp-step-customer .dbtp-next-btn').attr('disabled', 'disabled').addClass('dbtp-disabled');
				}
			});


			self.$app.on('click', '.dbtp-step-customer .dbtp-confirm-btn', function(){
				var slot = self.getSelectedSlot();
				var customer = $('.dbtp-step-customer .dbtp-step-form :input').serialize();
				// console.log(customer);

				// self.appBlock();
				// self.notify('Booking appointment', 'loading');
				self.$app.find('.dbtp-step-customer .dbtp-next-btn').attr('disabled', 'disabled').addClass('dbtp-loading');
				
				self.api('appointment', 'POST', {
					guid: slot.guid,
					packageId: slot.packageId,
					datetime: slot.datetime,
					treatments: slot.treatments,
					incomplete_appointment_id: self.incompleteAppointmentId,
					customer: customer
				})
				.done(function(r){
					// console.log(r);
					self.$app.find('.dbtp-step-customer .dbtp-next-btn').removeAttr('disabled').removeClass('dbtp-loading');
					
					if (r.success) {
						self.appointment = r.appointment;
						self.appointmentId = self.appointment.id;

						//self.appUnblock();
						//self.notify('Booking complete', 'success', 5000);
						
						self.load_step_confirmation();
					} else {
						//self.appUnblock();
						self.notify(r.message, 'error');
					}
				});
				return false;
			});


			self.$app.on('customer_changed', function(){
				if (validCustomerData()) {
					self.$app.find('.dbtp-step-customer .dbtp-next-btn').removeAttr('disabled').removeClass('dbtp-disabled');
				} else {
					self.$app.find('.dbtp-step-customer .dbtp-next-btn').attr('disabled', 'disabled').addClass('dbtp-disabled');
				}
			});

			self.$app.on('keyup', ':input', function(){
				//console.log('input changed');
				self.$app.trigger('customer_changed');
			});

			self.$app.trigger('customer_loaded');
		};

		self.load_step_confirmation = function(){
			self.$app.find('.dbtp-step-confirmation .dbtp-step-form').show();
			self.$app.find('.dbtp-step-confirmation .dbtp-step-instruction').removeClass('dbtp-error');

			if (! self.$app.data('confirmation_step_actions_initialized')) {
				self.step_confirmation_actions();
				self.$app.data('confirmation_step_actions_initialized', true);
			}

			self.state.step = 'confirmation';
			self.stateChanged();
			self.showStep(self.state.step);
		};
		self.step_confirmation_actions = function(){
			
			self.$app.on('click', '.dbtp-book-again-button', function(){
				self.appointment = {};
				self.slots = {};
				self.incompleteAppointmentId = {};
				self.appointmentId = {};
				self.customer = {};
				self.selectedTreatmentIds = [];
				self.selectedPackageIds = [];
				self.priceTotal = 0;
				self.fromDateTime = '';
				self.slotId = '';

				self.state.step = 'services';
				self.stateChanged();
				self.showStep(self.state.step);

				self.renderTreatmentsTemplate();
				self.renderPackagesTemplate();
				self.updateServicesFooterTemplate();
				return false;
			});


			var confirmationTextTemplate = $('#dbtp-confirmation-text-template').html(), confirmationTextHtml;
			var d = new Date(parseInt(self.appointment.start_date_time.substr(6, 13), 10));
			// convert the time to gmt
			d.setTime(d.getTime() + d.getTimezoneOffset()*60*1000);
			// convert the time to location timezone
			d.setTime(d.getTime() + (self.location.timezone_offset*1000));
			//console.log(d.toString());
			// d.setTime(d.getTime() + d.getTimezoneOffset()*60*1000);
			
			var dateStr = self.getWeekdayName(d) + ' '+ d.getDate() +' ' + self.getMonthName(d);
			var meridiem = d.getHours() >= 12 ? "PM" : "AM";
            var timeStr = ((d.getHours() + 11) % 12 + 1);
			if (d.getMinutes() > 0) {
				 timeStr += ":" + d.getMinutes();
			}
			timeStr += ' ' + meridiem;

			Mustache.parse(confirmationTextTemplate);
			confirmationTextHtml = Mustache.render(confirmationTextTemplate, {
				packagesCount: self.selectedPackageIds.length,
				treatmentsCount: self.selectedTreatmentIds.length,
				packagesOnly: self.selectedPackageIds.length > 0 && self.selectedTreatmentIds.length === 0,
				treatmentsOnly: self.selectedTreatmentIds.length > 0 && self.selectedPackageIds.length === 0,
				packagesAndTreatments: self.selectedTreatmentIds.length > 0 && self.selectedPackageIds.length > 0,
				priceTotal: self.priceTotal,
				dateStr: dateStr,
				timeStr: timeStr
			});
			self.$app.find('.dbtp-step-confirmation .dbtp-confirmation-text').html(confirmationTextHtml).show();

			self.$app.on('click', '.dbtp-step-confirmation .dbtp-next-btn', function(){
				self.load_step_services();
				return false;
			});
		};

		self.showStep = function(step){
			self.$app.find('.dbtp-step').not('.dbtp-step-services').removeClass('dbtp-current').hide();
			self.$app.find('#dbtp-'+ step).show().addClass('dbtp-current');
			self.$app.removeClass(function(index, cn) {
				return(cn.match (/(^|\s)dbtp-current-step-\S+/g)||[]).join(' ');
			}).addClass('dbtp-current-step-'+step);

			if (-1 !== $.inArray(step, ['date', 'slots', 'customer', 'confirmation'])) {
				$('html').addClass('dbtp-body-noscroll');
			} else {
				$('html').removeClass('dbtp-body-noscroll');
			}
			// self.scrollToApp();
		}
		self.stateChanged = function() {
			self.saveState();
		};
		self.getState = function() {
			var state = '';
			if (getTransient('dbtp_app_state') !== 'undefined' && typeof(getTransient('dbtp_app_state')) === 'string') {
				state = JSON.parse(getTransient('dbtp_app_state'));
			} else {
				state = {step : 'services'};
			}
			return state;
		};
		self.saveState = function() {
			setTransient('dbtp_app_state', JSON.stringify(self.state));
		};
		self.appBlock = function(){
			self.$app.addClass('dbtp-blocked');
		};
		self.appUnblock = function(){
			self.$app.removeClass('dbtp-blocked');
		};
		self.removeFormErrors = function($form){
			$form.removeClass('dbtp-form-has-errors dbtp-form-incomplete')
				.find('.dbtp-field-has-error').removeClass('dbtp-field-has-error')
				.find('.dbtp-field-error').remove();
			$form.find('.dbtp-form-button').removeAttr('disabled');
			$form.find('.dbtp-form-notes').empty().removeClass('dbtp-info dbtp-error');
		};
		self.formFieldError = function($form, $field, error) {
			if ($field.find('.dbtp-field-error').length > 0) {
				$field.find('.dbtp-field-error').html(error);
			} else {
				$field.append('<div class="dbtp-field-error">'+ error +'</div>');
			}
			$field.addClass('dbtp-field-has-error');
			$form.addClass('dbtp-form-has-errors');
		};
		self.notify = function(text, className, duration) {
			if ('ok' === className) {
				className = 'success';
			}
			if (self.$app.hasClass('dbtp-notification-enabled')) {
				self.$app.addClass('dbtp-notification-toggle');
			} else {
				self.$app.removeClass('dbtp-notification-enabled');
			}

			setTimeout(function(){
				self.$app.find('.dbtp-notification').html(text).removeClass('dbtp-error dbtp-success dbtp-info dbtp-loading').addClass('dbtp-'+ className);
				if (self.$app.hasClass('dbtp-notification-toggle')) {
					self.$app.removeClass('dbtp-notification-toggle');
				} else {
					self.$app.addClass('dbtp-notification-enabled');
				}
			}, 300);

			if (typeof(self.notificationTimeout) === 'number') {
				clearTimeout(self.notificationTimeout);
				self.notificationTimeout = null;
			}
			
			if (typeof(duration) === 'number' && duration > 0) {
				self.notificationTimeout = setTimeout(function(){
					self.$app.removeClass('dbtp-notification-enabled');
				}, duration);
			}
		};
		self.scrollToApp = function() {
			var scrollTop = self.$app.offset().top - parseInt($('html').css('margin-top'), 10);
			if ($('.fusion-header-wrapper.fusion-is-sticky').length > 0) {
				scrollTop = scrollTop - 65;
			}
			$('html, body').animate({ scrollTop: scrollTop }, 500);
		};

		// setup app & intialize
		self.setup(config);
		//self.init();

		// return object
		return self;
	};
	function getDateToday() {
		var d = new Date();
		return self.fromDate = d.getFullYear() +
				'-' + (d.getMonth() < 9 ? '0'+ (d.getMonth()+1) : (d.getMonth()+1)) +
				'-' + (d.getDate() < 10 ? '0'+ d.getDate() : d.getDate());
	}
	function getDateAfter(number) {
		var d = new Date();
		d.setDate(d.getDate() + number);
		return self.fromDate = d.getFullYear() +
				'-' + (d.getMonth() < 9 ? '0'+ (d.getMonth()+1) : (d.getMonth()+1)) +
				'-' + (d.getDate() < 10 ? '0'+ d.getDate() : d.getDate());
	}
	function getFirstDateOfMonth(year, month) {
		var d = new Date(year, month, 1);
		return self.toDate = d.getFullYear() +
		'-' + (d.getMonth() < 9 ? '0'+ (d.getMonth()+1) : (d.getMonth()+1)) +
		'-' + (d.getDate() < 10 ? '0'+ d.getDate() : d.getDate());
	}
	function getLastDateOfMonth(year, month) {
		var d = new Date(year, month + 1, 0);
		return self.toDate = d.getFullYear() +
		'-' + (d.getMonth() < 9 ? '0'+ (d.getMonth()+1) : (d.getMonth()+1)) +
		'-' + (d.getDate() < 10 ? '0'+ d.getDate() : d.getDate());
	}
	function formatPhoneNumber(phoneNumberString) {
	  var cleaned = ('' + phoneNumberString).replace(/\D/g, '')
	  var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/)
	  if (match) {
		var intlCode = (match[1] ? '+1 ' : '')
		return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('')
	  }
	  return phoneNumberString
	}
	function formdataToObject(formdata) {
		return formdata.split('&').reduce(function(prev, curr) {
			var p = curr.split('=');
			prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
			return prev;
		}, {});
	}
	function getTransient(key) {
		return localStorage.getItem(key);
	}
	function setTransient(key, val) {
		localStorage.setItem(key, val);
	}
})(jQuery);
