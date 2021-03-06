angular.module('jm.i18next', ['ng']);
angular.module('jm.i18next').provider('$i18next', function () {

	'use strict';

	var self = this,
		/**
		 * This will be our translation function (see code below)
		 */
		t = null,
		translations = {},
		globalOptions = null,
		translateOptions = null,
		triesToLoadI18next = 0;

	self.options = {};

	self.$get = ['$rootScope', '$timeout', function ($rootScope, $timeout) {

		function init(options) {

			if (window.i18n) {

				window.i18n.init(options, function (localize) {

					translations = {};

					t = localize;

					if (!$rootScope.$$phase) {
						$rootScope.$digest();
					}

					$rootScope.$broadcast('i18nextLanguageChange', window.i18n.lng());

				});

			} else {

				triesToLoadI18next++;
				// only check 4 times for i18next
				if (triesToLoadI18next < 5) {

					$timeout(function () {
						init(options);
					}, 400);

				} else {
					throw new Error('[ng-i18next] Can\'t find i18next!');
				}

			}
		}

		function optionsChange(newOptions, oldOptions) {

			$i18nextTanslate.debugMsg.push(['i18next options changed:', oldOptions, newOptions]);

			globalOptions = newOptions;
			translateOptions = angular.copy(globalOptions);
			delete translateOptions.lng;

			init(globalOptions);

		}

		/**
		 * Translates `key` with given options and puts the translation into `translations`.
		 * @param {Boolean} hasOwnOptions hasOwnOptions means that we are passing options to
		 *                                $i18next so we can't use previous saved translation.
		 */
		function translate(key, options, hasOwnOptions) {

			var lng = options.lng || 'auto';

			if (!translations[lng]) {
				translations[lng] = {};
			}

			if (!t) {

				translations[lng][key] = 'defaultLoadingValue' in options ? options.defaultLoadingValue :
					'defaultValue' in options ? options.defaultValue :
					'defaultLoadingValue' in globalOptions ? globalOptions.defaultLoadingValue : key;

			} else if (!translations[lng][key] || hasOwnOptions) {

				translations[lng][key] = t(key, options);

			}

		}

		function $i18nextTanslate(key, options) {

			var mergedOptions = !!options ? angular.extend({}, translateOptions, options) : translateOptions;

			translate(key, mergedOptions, !!options);

			return !!mergedOptions.lng ? translations[mergedOptions.lng][key] : translations['auto'][key];

		}

		$i18nextTanslate.debugMsg = [];

		$i18nextTanslate.options = self.options;

		if (self.options !== globalOptions) {
			optionsChange(self.options, globalOptions);
		}

		$i18nextTanslate.reInit = function () {
			optionsChange(globalOptions, globalOptions);
		};

		$rootScope.$watch(function () { return $i18nextTanslate.options; }, function (newOptions, oldOptions) {
			// Check whether there are new options and whether the new options are different from the old options.
			if (!!newOptions && oldOptions !== newOptions) {
				optionsChange(newOptions, oldOptions);
			}
		}, true);

		return $i18nextTanslate;

	}];

});
