#!/bin/bash

for filename in `ls *.xls`
do
  name=${filename%%.*};
  ext=${filename##*.};
  n=`echo  ${filename} | sed 's/　/-/g'`;
  mv $filename $n;
#  echo $name.$ext;
#  xls2csv -x ${filename} -s cp1252 -d 8859-1 > temp/${name}.csv;
done
