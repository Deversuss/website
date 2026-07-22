/*
	Hyperspace by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$sidebar = $('#sidebar');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ null,      '480px'  ]
		});

	// Hack: Enable IE flexbox workarounds.
		if (browser.name == 'ie')
			$body.addClass('is-ie');

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Forms.

		// Hack: Activate non-input submits.
			$('form').on('click', '.submit', function(event) {

				// Stop propagation, default.
					event.stopPropagation();
					event.preventDefault();

				// Submit form.
					$(this).parents('form').submit();

			});

	// Sidebar.
		if ($sidebar.length > 0) {

			var $sidebar_a = $sidebar.find('a');

			$sidebar_a
				.addClass('scrolly')
				.on('click', function() {

					var $this = $(this);

					// External link? Bail.
						if ($this.attr('href').charAt(0) != '#')
							return;

					// Deactivate all links.
						$sidebar_a.removeClass('active');

					// Activate link *and* lock it (so Scrollex doesn't try to activate other links as we're scrolling to this one's section).
						$this
							.addClass('active')
							.addClass('active-locked');

				})
				.each(function() {

					var	$this = $(this),
						id = $this.attr('href'),
						$section = $(id);

					// No section for this link? Bail.
						if ($section.length < 1)
							return;

					// Scrollex.
						$section.scrollex({
							mode: 'middle',
							top: '-20vh',
							bottom: '-20vh',
							initialize: function() {

								// Deactivate section.
									$section.addClass('inactive');

							},
							enter: function() {

								// Activate section.
									$section.removeClass('inactive');

								// No locked links? Deactivate all links and activate this section's one.
									if ($sidebar_a.filter('.active-locked').length == 0) {

										$sidebar_a.removeClass('active');
										$this.addClass('active');

									}

								// Otherwise, if this section's link is the one that's locked, unlock it.
									else if ($this.hasClass('active-locked'))
										$this.removeClass('active-locked');

							}
						});

				});

		}

	// Scrolly.
		$('.scrolly').scrolly({
			speed: 1000,
			offset: function() {

				// If <=large, >small, and sidebar is present, use its height as the offset.
					if (breakpoints.active('<=large')
					&&	!breakpoints.active('<=small')
					&&	$sidebar.length > 0)
						return $sidebar.height();

				return 0;

			}
		});

	// Spotlights.
		$('.spotlights > section')
			.scrollex({
				mode: 'middle',
				top: '-10vh',
				bottom: '-10vh',
				initialize: function() {

					// Deactivate section.
						$(this).addClass('inactive');

				},
				enter: function() {

					// Activate section.
						$(this).removeClass('inactive');

				}
			})
			.each(function() {

				var	$this = $(this),
					$image = $this.find('.image'),
					$img = $image.find('img'),
					x;

				// Assign image.
					$image.css('background-image', 'url(' + $img.attr('src') + ')');

				// Set background position.
					if (x = $img.data('position'))
						$image.css('background-position', x);

				// Hide <img>.
					$img.hide();

			});

	// Features.
		$('.features')
			.scrollex({
				mode: 'middle',
				top: '-20vh',
				bottom: '-20vh',
				initialize: function() {

					// Deactivate section.
						$(this).addClass('inactive');

				},
				enter: function() {

					// Activate section.
						$(this).removeClass('inactive');

				}
			});

	// Custom voting flow for the gala page.
		var fallbackCandidates = [
			{ name: 'Michał Krawczyk', faculty: 'Wydział Informatyki', commission: 'komisja współpracy' },
			{ name: 'Karolina Szymańska', faculty: 'Wydział Zarządzania', commission: 'komisja kultury' },
			{ name: 'Patryk Nowicki', faculty: 'Wydział Mechaniczny', commission: 'komisja sportu' },
			{ name: 'Alicja Wiśniewska', faculty: 'Wydział Budownictwa', commission: 'komisja promocji' }
		];
		var fallbackVoters = [
			{ name: 'Jan Nowak', faculty: 'Wydział Informatyki', commission: 'komisja współpracy' },
			{ name: 'Anna Kowalska', faculty: 'Wydział Zarządzania', commission: 'komisja kultury' },
			{ name: 'Piotr Wiśniewski', faculty: 'Wydział Mechaniczny', commission: 'komisja sportu' },
			{ name: 'Marta Zielińska', faculty: 'Wydział Budownictwa', commission: 'komisja promocji' }
		];
		var candidates = [];
		var voters = [];
		var votedVoters = [];
		var votes = {};
		var showResults = false;

		function normalizeValue(value) {
			return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
		}

		function parseVoters(rawText) {
			return rawText.split(/\r?\n/).filter(Boolean).map(function(line) {
				var parts = line.split('-').map(function(part) {
					return part.trim();
				});

				if (parts.length >= 3) {
					return { name: parts[0], faculty: parts[1], commission: parts[2] };
				}

				return null;
			}).filter(Boolean);
		}

		function parseCandidates(rawText) {
			return rawText.split(/\r?\n/).filter(Boolean).map(function(line) {
				var parts = line.split('-').map(function(part) {
					return part.trim();
				});

				if (parts.length >= 3) {
					return { name: parts[0], faculty: parts[1], commission: parts[2] };
				}

				return null;
			}).filter(Boolean);
		}

		function parseStatistics(rawText) {
			var rows = rawText.split(/\r?\n/).filter(Boolean);
			var stats = {};

			if (rows.length < 2) {
				return stats;
			}

			rows.slice(1).forEach(function(row) {
				var columns = row.split(',').map(function(cell) {
					return cell.trim();
				});

				if (columns.length >= 4) {
					stats[columns[0]] = parseInt(columns[3], 10) || 0;
				}
			});

			return stats;
		}

		function buildCandidateOptions() {
			var select = document.getElementById('candidateSelect');
			if (!select) {
				return;
			}

			select.innerHTML = '';
			candidates.forEach(function(candidate) {
				var option = document.createElement('option');
				option.value = candidate.name;
				option.textContent = candidate.name + ' — ' + candidate.faculty + ' — ' + candidate.commission;
				select.appendChild(option);
			});
		}

		function setStatus(message, isError) {
			var status = document.getElementById('voteStatus');
			if (!status) {
				return;
			}

			status.textContent = message;
			status.style.color = isError ? '#ffb4b4' : '#d9ffb3';
		}

		function validateFormFields(name, faculty, commission, candidate) {
			var errors = [];

			if (!name || name.length < 2) {
				errors.push('Podaj imię i nazwisko.');
			}

			if (!faculty || faculty.length < 3) {
				errors.push('Podaj poprawny wydział.');
			}

			if (!commission || commission.length < 3) {
				errors.push('Podaj poprawną komisję.');
			}

			if (!candidate) {
				errors.push('Wybierz kandydata z listy.');
			}

			if (name && name.indexOf(' ') === -1) {
				errors.push('Podaj imię i nazwisko w formacie: Imię Nazwisko.');
			}

			return errors;
		}

		function getVoterByIdentity(name, faculty, commission) {
			return voters.find(function(voter) {
				return normalizeValue(voter.name) === normalizeValue(name)
					&& normalizeValue(voter.faculty) === normalizeValue(faculty)
					&& normalizeValue(voter.commission) === normalizeValue(commission);
			});
		}

		function getVoterKey(name, faculty, commission) {
			return normalizeValue(name) + '|' + normalizeValue(faculty) + '|' + normalizeValue(commission);
		}

		function resetVotes() {
			votes = {};
			candidates.forEach(function(candidate) {
				votes[candidate.name] = 0;
			});
		}

		function saveStatisticsToStorage() {
			var csvContent = 'name,faculty,commission,votes\n' + candidates.map(function(candidate) {
				return [candidate.name, candidate.faculty, candidate.commission, votes[candidate.name] || 0].join(',');
			}).join('\n');

			localStorage.setItem('galaStatistics', JSON.stringify(votes));
			localStorage.setItem('galaStatisticsCsv', csvContent);
		}

		function updateResults() {
			var resultsContent = document.getElementById('resultsContent');
			if (!resultsContent) {
				return;
			}

			if (!showResults) {
				resultsContent.innerHTML = '<p>Wyniki są ukryte. Kliknij przycisk, aby je zobaczyć.</p>';
				return;
			}

			var rows = candidates.map(function(candidate) {
				var count = votes[candidate.name] || 0;
				return '<li><strong>' + candidate.name + '</strong> — ' + count + ' głosów</li>';
			}).join('');

			resultsContent.innerHTML = '<ul>' + rows + '</ul>';
		}

		function loadVotingData() {
			return fetch('voters.txt').then(function(response) {
				if (!response || !response.ok) {
					throw new Error('Fallback');
				}
				return response.text();
			}).then(function(rawText) {
				voters = parseVoters(rawText);
			}).catch(function() {
				voters = fallbackVoters;
			}).then(function() {
				return fetch('voted.txt').then(function(response) {
					if (!response || !response.ok) {
						throw new Error('FallbackCandidates');
					}
					return response.text();
				}).then(function(rawText) {
					candidates = parseCandidates(rawText);
				}).catch(function() {
					candidates = fallbackCandidates;
				});
			}).then(function() {
				resetVotes();

				var savedVotes = localStorage.getItem('galaStatistics');
				if (savedVotes) {
					try {
						var parsedVotes = JSON.parse(savedVotes);
						Object.keys(parsedVotes).forEach(function(candidateName) {
							if (votes[candidateName] !== undefined) {
								votes[candidateName] = parsedVotes[candidateName];
							}
						});
					} catch (error) {
						console.log('Unable to parse saved statistics');
					}
				} else {
					return fetch('statistics.csv').then(function(response) {
						if (!response || !response.ok) {
							throw new Error('FallbackStats');
						}
						return response.text();
					}).then(function(rawText) {
						var stats = parseStatistics(rawText);
						Object.keys(stats).forEach(function(candidateName) {
							if (votes[candidateName] !== undefined) {
								votes[candidateName] = stats[candidateName];
							}
						});
					}).catch(function() {
						return null;
					});
				}
			}).then(function() {
				var savedVoters = localStorage.getItem('galaVotedVoters');
				if (savedVoters) {
					try {
						votedVoters = JSON.parse(savedVoters);
					} catch (error) {
						votedVoters = [];
					}
				}

				buildCandidateOptions();
				saveStatisticsToStorage();
				updateResults();
			});
		}

		var voteForm = document.getElementById('voteForm');
		if (voteForm) {
			voteForm.addEventListener('submit', function(event) {
				event.preventDefault();

				var name = document.getElementById('voterName').value.trim();
				var faculty = document.getElementById('voterFaculty').value.trim();
				var commission = document.getElementById('voterCommission').value.trim();
				var candidateName = document.getElementById('candidateSelect').value;
				var candidate = candidates.find(function(entry) {
					return entry.name === candidateName;
				});
				var voter = getVoterByIdentity(name, faculty, commission);
				var voterKey = getVoterKey(name, faculty, commission);
				var validationErrors = validateFormFields(name, faculty, commission, candidate);

				if (validationErrors.length > 0) {
					setStatus(validationErrors.join(' '), true);
					return;
				}

				if (!voter) {
					setStatus('Nie znaleziono Cię w pliku voters.txt. Sprawdź wpisane dane i spróbuj ponownie.', true);
					return;
				}

				if (votedVoters.indexOf(voterKey) !== -1) {
					setStatus('Ten wyborca już oddał głos. Jednorazowy głos został wykorzystany.', true);
					return;
				}

				if (normalizeValue(faculty) === 'wydział informatyki' && (normalizeValue(candidate.faculty) === normalizeValue(faculty) || normalizeValue(candidate.commission) === normalizeValue(commission))) {
					setStatus('Osoby z Wydziału Informatyki nie mogą głosować na własny wydział ani na własną komisję.', true);
					return;
				}

				votes[candidate.name] = (votes[candidate.name] || 0) + 1;
				votedVoters.push(voterKey);
				localStorage.setItem('galaVotedVoters', JSON.stringify(votedVoters));
				saveStatisticsToStorage();
				setStatus('Twój głos został oddany poprawnie.', false);
				updateResults();
			});
		}

		var toggleResultsButton = document.getElementById('toggleResults');
		if (toggleResultsButton) {
			toggleResultsButton.addEventListener('click', function() {
				showResults = !showResults;
				toggleResultsButton.textContent = showResults ? 'Ukryj wyniki' : 'Pokaż wyniki';
				updateResults();
			});
		}

		var exportStatisticsButton = document.getElementById('exportStatistics');
		if (exportStatisticsButton) {
			exportStatisticsButton.addEventListener('click', function() {
				var csvContent = localStorage.getItem('galaStatisticsCsv') || 'name,faculty,commission,votes\n';
				var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
				var url = URL.createObjectURL(blob);
				var link = document.createElement('a');
				link.href = url;
				link.download = 'statistics.csv';
				link.click();
				URL.revokeObjectURL(url);
				setStatus('Plik statistics.csv został przygotowany do pobrania.', false);
			});
		}

		loadVotingData();

})(jQuery);