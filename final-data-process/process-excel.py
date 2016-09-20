#!usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import re
import xlrd

def mkdir(path):
    # 引入模块
    import os
 
    # 去除首位空格
    path=path.strip()
    # 去除尾部 \ 符号
    path=path.rstrip("\\")
 
    # 判断路径是否存在
    # 存在     True
    # 不存在   False
    isExists=os.path.exists(path)
 
    # 判断结果
    if not isExists:
        # 如果不存在则创建目录
        print(path+' 创建成功')
        # 创建目录操作函数
        os.makedirs(path)
        return True
    else:
        # 如果目录存在则不创建，并提示目录已存在
        print(path+' 目录已存在')
        return False

path = os.listdir('./signal_tree_data')
mkpath = './signal_tree_csv'
# 调用函数
mkdir(mkpath)
fileLen = len(path)
fileNameArray = [''] * fileLen
fileNewNameArray = [''] * fileLen

for i in range(0, fileLen):
	if path[i] != '.DS_Store':
		fileNameArray[i] = path[i]
		fileNewNameArray[i] = path[i].replace("\u3000","-").replace('.xls','').strip()
		data = xlrd.open_workbook('./signal_tree_data/' + path[i])
		fw = open('./signal_tree_csv/' + fileNewNameArray[i] +'.csv', 'w', encoding='utf8')
		data.sheet_names()
		table = data.sheets()[0]
		table = data.sheet_by_index(0)
		nrows = table.nrows
		for j in range(0, nrows):
			lineStr = '\"' + table.row_values(j)[0] + '\"'
			for k in range(1, len(table.row_values(j))):
					lineStr = lineStr + ',' + '\"' + table.row_values(j)[k] + '\"'
			fw.write(lineStr + '\n')