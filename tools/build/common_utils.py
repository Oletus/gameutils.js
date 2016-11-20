from __future__ import print_function

import os

def game_root_path():
    file_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(file_path, '..', '..'))

def files_with_type(root, type):
    all_files = [os.path.join(root, filename) for filename in os.listdir(root)]
    typed_files = [path for path in all_files if path.endswith('.' + type)]
    return typed_files

def sha1_of_file(filepath):
    import hashlib
    if not os.path.exists(filepath):
        return ''
    with open(filepath, 'rb') as f:
        return hashlib.sha1(f.read()).hexdigest()

def fetch_file(url, target_path, sha1):
    if sha1_of_file(target_path) == sha1:
        return True # Already downloaded
    import urllib
    if hasattr(urllib, 'urlretrieve'):
        # Python 2
        urllib.urlretrieve(url, target_path)
    else:
        # Python 3
        import urllib.request
        urllib.request.urlretrieve(url, target_path)
    if sha1 == None:
        print('sha1 of ' + target_path + ': ' + sha1_of_file(target_path))
    elif sha1_of_file(target_path) != sha1:
        if os.path.exists(target_path):
            os.remove(target_path)
        return False
    return True

def python27_path():
    import sys
    exe = ''
    if sys.version_info.minor == 7 and sys.version_info.major == 2:
        exe = sys.executable
    elif sys.platform.startswith("linux"):
        exe = '/usr/local/bin/python2.7'
    elif sys.platform == "darwin":
        exe = '/usr/local/bin/python2.7'
    elif sys.platform == "win32":
        exe = 'C:\Python27\python.exe'
    return exe

if __name__ == '__main__':
    print('Game root path: ' + game_root_path())
