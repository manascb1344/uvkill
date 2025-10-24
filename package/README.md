<p align="center">
  <h1>UVKill</h1>
</p>

### Easily find and **remove** old and heavy <font color="red">**Python virtual environments**</font> folders :sparkles:

<p align="center">
  <img src="/docs/npkill-demo-0.10.0.gif" alt="uvkill demo GIF" />
</p>

This tool allows you to list any _Python virtual environment_ directories in your system, as well as the space they take up. You can then select which ones you want to erase to free up space. Yay!

## About

UVKill is a fork of [NPKill](https://github.com/voidcosmos/npkill) specifically adapted for Python virtual environments. While NPKill helps you find and remove node_modules directories, UVKill focuses on Python virtual environments like .venv, venv, virtualenv, and others.

### Credits

This project is based on [NPKill](https://github.com/voidcosmos/npkill) by [Nya García Gallardo](https://github.com/NyaGarcia) and [Juan Torres Gómez](https://github.com/zaldih). We've adapted their excellent work to serve the Python community's needs for virtual environment management.

**Original NPKill Project**: https://github.com/voidcosmos/npkill

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Multi-Select Mode](#multi-select-mode)
  - [Options](#options)
  - [Examples](#examples)
  - [JSON Output](#json-output)
- [Set Up Locally](#setup-locally)
- [API](#API)
- [Roadmap](#roadmap)
- [Known bugs](#known-bugs)
- [Contributing](#contributing)
- [License](#license)

<a name="features"></a>

# :heavy_check_mark: Features

- **Clear space:** Get rid of old and dusty _Python virtual environments_ cluttering up your machine.

- **Last Workspace Usage**: Check when was the last time you modified a file in the workspace (indicated in the **last_mod** column).

- **Very fast:** UVKill is written in TypeScript, but searches are performed at a low level, improving performance greatly.

- **Easy to use:** Say goodbye to lengthy commands. Using uvkill is as simple as reading a list of your virtual environments, and pressing Del to get rid of them. Could it be any easier? ;)

- **Python-aware:** Detects virtual environments by looking for pyvenv.cfg, activate scripts, and Python interpreters.

- **Minified:** It barely has any dependencies.

<a name="installation"></a>

# :cloud: Installation

You don't really need to install it to use it!
Simply use the following command:

```bash
$ npx uvkill
```

Or if for some reason you really want to install it:

```bash
$ npm i -g uvkill
# Unix users may need to run the command with sudo. Go carefully
```

> UVKill requires node>=v18.18.0

<a name="usage"></a>

# :clipboard: Usage

```bash
$ npx uvkill
# or just uvkill if installed globally
```

By default, uvkill will scan for Python virtual environments starting at the path where `uvkill` command is executed.

Move between the listed folders with <kbd>↓</kbd> <kbd>↑</kbd>, and use <kbd>Space</kbd> or <kbd>Del</kbd> to delete the selected folder.
You can also use <kbd>j</kbd> and <kbd>k</kbd> to move between the results.

You can open the directory where the selected result is placed by pressing <kbd>o</kbd>.

To exit, <kbd>Q</kbd> or <kbd>Ctrl</kbd> + <kbd>c</kbd> if you're brave.

**Important!** Some virtual environments may be needed by production applications or system tools. UVKill will highlight potentially sensitive directories by displaying a :warning: to be careful.

## Multi-Select Mode

This mode allows you to select and delete multiple folders at once, making it more efficient when cleaning up many directories.

### Entering Multi-Select Mode

Press <kbd>T</kbd> to toggle multi-select mode. When active, you'll see a selection counter and additional instructions at the top of the results.

### Controls

- **<kbd>Space</kbd>**: Toggle selection of the current folder.
- **<kbd>V</kbd>**: Start/end range selection mode.
- **<kbd>A</kbd>**: Toggle select/unselect all folders.
- **<kbd>Enter</kbd>**: Delete all selected folders.
- **<kbd>T</kbd>**: Unselect all and back to normal mode.

### Range Selection

After pressing <kbd>V</kbd> to enter range selection mode:

- Move the cursor with arrow keys, <kbd>j</kbd>/<kbd>k</kbd>, <kbd>Home</kbd>/<kbd>End</kbd>, or page up/down
- All folders between the starting position and current cursor position will be selected/deselected
- Press <kbd>V</kbd> again to exit range selection mode

<a name="options"></a>

## Options

| ARGUMENT                         | DESCRIPTION                                                                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -p, --profiles                   | Allows you to select the [profile](./docs/profiles.md) (set of targets) to use. If no option is specified, the available ones will be listed.. _(**node** by default)_.             |
| -d, --directory                  | Set the directory from which to begin searching. By default, starting-point is .                                                                                                    |
| -D, --delete-all                 | Automatically delete all node_modules folders that are found. Suggested to be used together with `-x`.                                                                              |
| -e, --hide-errors                | Hide errors if any                                                                                                                                                                  |
| -E, --exclude                    | Exclude directories from search (directory list must be inside double quotes "", each directory separated by ',' ) Example: "ignore1, ignore2"                                      |
| -f, --full                       | Start searching from the home of the user (example: "/home/user" in linux)                                                                                                          |
| --size-unit                      | Set the unit for displaying folder sizes. _(Available: **auto**, mb, gb)_. With auto, sizes < 1024MB are shown in MB (rounded), larger sizes in GB (with decimals).                 |
| -h, --help, ?                    | Show this help page and exit                                                                                                                                                        |
| -nu, --no-check-update           | Don't check for updates on startup                                                                                                                                                  |
| -s, --sort                       | Sort results by: `size`, `path` or `last-mod`                                                                                                                                       |
| -t, --target                     | Specify the name of the directories you want to search for (by default, it's 'node_modules'). You can define multiple targets separating with comma. Ej. `-t node_modules,.cache,`. |
|                                  |
| -x, --exclude-hidden-directories | Exclude hidden directories ("dot" directories) from search.                                                                                                                         |
| --dry-run                        | It does not delete anything (will simulate it with a random delay).                                                                                                                 |
| --json                           | Output results in JSON format at the end of the scan. Useful for automation and scripting.                                                                                          |
| --json-stream                    | Output results in streaming JSON format (one JSON object per line as results are found). Useful for real-time processing.                                                           |
| -v, --version                    | Show uvkill version                                                                                                                                                                 |

**Warning:** _In future versions some commands may change_

<a name="examples"></a>

## Examples

- Search **virtual environments** in your _projects_ directory:

```bash
uvkill -d ~/projects

# other alternative:
cd ~/projects
uvkill
```

- List directories named ".venv" and show errors if any occur:

```bash
uvkill --target .venv -e
```

- List **virtual environments** in your _projects_ directory, sort by size, and show size in gb:

```bash
uvkill -d '~/my projects' --size-unit gb --sort size
```

- List **virtual environments** in your _projects_ directory, excluding the ones in _production_ and _ignore-this_ directories:

```bash
uvkill -d 'projects' --exclude "production, ignore-this"
```

- Automatically delete all virtual environments that have sneaked into your backups:

```bash
uvkill -d ~/backups/ --delete-all
```

- Get results in JSON format for automation or further processing:

```bash
uvkill --json > results.json
```

- Stream results in real-time as JSON (useful for monitoring or piping to other tools):

```bash
uvkill --json-stream | jq '.'
```

- Save only successful results to a file, ignoring errors:

```bash
uvkill --json-stream 2>/dev/null | jq -s '.' > clean-results.json
```

<a name="json-output"></a>

## JSON Output

UVKill supports JSON output formats for automation and integration with other tools:

- **`--json`**: Output all results as a single JSON object at the end of the scan
- **`--json-stream`**: Output each result as a separate JSON object in real-time

For detailed documentation, examples, and TypeScript interfaces, see [JSON Output Documentation](./docs/json-output.md).

**Quick Examples:**

```bash
# Get all results as JSON
uvkill --json > results.json

# Process results in real-time
uvkill --json-stream | jq '.result.path'

# Find directories larger than 100MB
uvkill --json | jq '.results[] | select(.size > 104857600)'
```

<a name="setup-locally"></a>

# :pager: Set Up Locally

```bash
# -- First, clone the repository
git clone https://github.com/manascb1344/uvkill.git

# -- Navigate to the dir
cd uvkill

# -- Install dependencies
npm install

# -- And run!
npm run start


# -- If you want to run it with some parameter, you will have to add "--" as in the following example:
npm run start -- -f -e
```

<a name="API"></a>

# :bookmark_tabs: API

The API allows you to interact with uvkill from node to create your own implementations in your scripts (automations, for example).

You can check the basic API [here](./API.md).

<a name="roadmap"></a>

# :crystal_ball: Roadmap

- [x] Release 0.1.0 !
- [x] Improve code
  - [x] Improve performance
  - [ ] Improve performance even more!
- [x] Sort results by size and path
- [x] Allow the search for other types of directories (targets)
- [ ] Reduce dependencies to be a more minimalist module
- [ ] Allow to filter by directories that have not been used in a period of time
- [ ] Create option for displaying directories in tree format
- [x] Add some menus
- [x] Add log service
- [ ] Periodic and automatic cleaning (?)

<a name="known-bugs"></a>

# :bug: Known bugs :bug:

- Sometimes, CLI is blocked while folder is deleting.
- Some terminals that do not use TTY (like git bash in windows) do not work.
- Sorting, especially by routes, can slow down the terminal when there are many results at the same time.
- Sometimes, size calculations are higher than they should be.
- (SOLVED) Performance issues when searching from high level directories (like / in linux).
- (SOLVED) Sometimes text collapses when updating the cli.
- (SOLVED) Analyzing the size of the directories takes longer than it should.

> If you find any bugs, don't hesitate and open an issue :)

<a name="contributing"></a>

# :revolving_hearts: Contributing

If you want to contribute check the [CONTRIBUTING.md](.github/CONTRIBUTING.md)

<a name="license"></a>

# :scroll: License

MIT License

**UVKill** - Python virtual environment management tool  
Adapted from [NPKill](https://github.com/voidcosmos/npkill)

**Original NPKill Authors**: [Nya García Gallardo](https://github.com/NyaGarcia) and [Juan Torres Gómez](https://github.com/zaldih)  
**UVKill Adaptation**: [manascb1344](https://github.com/manascb1344)

This project is a fork of NPKill, adapted for Python virtual environments while maintaining the same MIT license.

---
