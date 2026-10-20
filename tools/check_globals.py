#!/usr/bin/env python3
"""Fails when a built game declares the same top-level name twice (a function declared twice silently overwrites the first; a const twice is a syntax error).
  python3 tools/check_globals.py [game ...]      (default: every game in dist/)
Known, reviewed duplicates are listed in tools/check_globals_allow.txt (one name per line)."""
import os, re, sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def top_level_decls(src):
    out=[]; i=0; n=len(src); depth=0; last=''   # last significant char, for regex-literal detection
    def skip_str(i,q):
        i+=1
        while i<n:
            c=src[i]
            if c=='\\': i+=2; continue
            if q=='`' and c=='$' and i+1<n and src[i+1]=='{':
                d=1; i+=2
                while i<n and d:
                    if src[i]=='{': d+=1
                    elif src[i]=='}': d-=1
                    elif src[i] in '\'"`': i=skip_str(i,src[i]); continue
                    i+=1
                continue
            if c==q: return i+1
            i+=1
        return i
    while i<n:
        c=src[i]
        if c in '\'"`': i=skip_str(i,c); last='s'; continue
        if c=='/' and i+1<n and src[i+1]=='/': j=src.find('\n',i); i=n if j<0 else j; continue
        if c=='/' and i+1<n and src[i+1]=='*': j=src.find('*/',i+2); i=n if j<0 else j+2; continue
        if c=='/' and last in '(,=:[!&|?{};+-*%<>~^' or (c=='/' and last==''):
            j=i+1; inc=False
            while j<n and src[j]!='\n':
                if src[j]=='\\': j+=2; continue
                if src[j]=='[': inc=True
                elif src[j]==']': inc=False
                elif src[j]=='/' and not inc: break
                j+=1
            i=j+1; last='r'; continue
        if c in '{': depth+=1
        elif c=='}': depth-=1
        elif depth==0 and (c.isalpha() or c in '_$') and (i==0 or not (src[i-1].isalnum() or src[i-1] in '_$.')):
            m=re.match(r'(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)',src[i:i+200])
            if m:
                out.append(m.group(1) or m.group(2)); i+=len(m.group(0)); last='x'; continue
        if not c.isspace(): last=c
        i+=1
    return out
def main():
    allow=set(l.split('#')[0].strip() for l in open(os.path.join(ROOT,'tools','check_globals_allow.txt')) if l.split('#')[0].strip()) if os.path.exists(os.path.join(ROOT,'tools','check_globals_allow.txt')) else set()
    games=sys.argv[1:] or sorted(d for d in os.listdir(os.path.join(ROOT,'dist')) if os.path.exists(os.path.join(ROOT,'dist',d,'game.js'))); bad=0
    for g in games:
        names=top_level_decls(open(os.path.join(ROOT,'dist',g,'game.js'),encoding='utf-8').read()); seen={}; dup=[]
        for nm in names:
            if nm in seen and nm not in allow: dup.append(nm)
            seen[nm]=seen.get(nm,0)+1
        print(g,len(names),'top-level declarations;', ('DUPLICATES: '+', '.join(sorted(set(dup)))) if dup else 'no duplicates'); bad+=bool(dup)
    sys.exit(1 if bad else 0)
main()
