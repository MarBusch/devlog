# Change Log
All notable chanages to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [0.1.1] - 2015-09-16
### Added
- Tooltip for tags, displaying the tag seperator (comma).

### Fixed
- Slow startup time in windows.
- Huge size of binaries.

## [0.1.0] - 2015-09-09
### Changed
- Version is being changed. According to semver the initial version should
  be 0.1.0 not 0.0.1. So the next release would be 0.1.0 not 0.0.3
- New UI (Lot of improvements)
- Using semantic-ui 2.1.x
- Autosave now works only in log content and doesn't work in title and tags.

### Fixed
- Issue with windows build is fixed by using npm@3.0
- Unselect all radio buttons in restore/delete modal when cancel button is
  pressed

## [0.0.2] - 2015-05-08
### Note
- This release is not working in windows. This is due to design feature in windows.
  It has a character limit of 256 chars in file path.

### Added
- Keyboard shortcuts for saving and bringing restore/delete modal.
- Ability to restore/permanently delete removed logs.

### Fixed
- User unable to click on empty log.
- User able to create multiple new logs without title or content.

## [0.0.1] - 2015-04-11
Initial release

### Note
- This release is not working in windows. This is due to design feature in windows.
  It has a character limit of 256 chars in file path.

### Added
- Create/edit/remove logs.
- Attach tags to logs.
- Auto save (After 1000ms of typing).
- Manual save (Clicking on save button).
- Available for os x, linux and win (64 bit only).
