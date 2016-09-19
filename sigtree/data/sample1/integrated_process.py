#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import re
from imp import reload
import sys

reload(sys)
print (sys.getdefaultencoding())

def similarity_handler(node_array1, node_array2):
	similar_num = 0
	for i in range(0, len(node_array1)):
		for j in range(0, len(node_array2)):
			if node_array1[i] == node_array2[j]:
				similar_num = similar_num + 1
	return similar_num
def distance_handler(node_array1, node_array2):
	distance = 0
	similar_num = 0
	len_node_array1 = len(node_array1)
	len_node_array2 = len(node_array2)
	for i in range(0, len_node_array1):
		for j in range(0, len_node_array2):
			if node_array1[i] == node_array2[j]:
				similar_num = similar_num + 1
	distance = int(len_node_array1) - int(similar_num) + int(len_node_array2) - int(similar_num)
	return distance
def similarity_distance_handler(fileNodeArray):
	#两两对比节点数组，获取相似度矩阵以及距离矩阵
	fw_similarity = open('./similarity_matrix.csv', 'w', encoding = 'utf8')
	fw_distance = open('./distance_matrix.csv', 'w', encoding = 'utf8')
	fw_level_node_num = open('./level_node_num.csv', 'w', encoding = 'utf8')
	firstLineAttrName = 'fileName'
	fileLen = len(fileNodeArray)
	for i in range(0, fileLen):
		firstLineAttrName = firstLineAttrName + ',attr' + str(i)
	#print(firstLineAttrName)
	fw_similarity.write(firstLineAttrName + '\n')
	fw_distance.write(firstLineAttrName + '\n')
	fw_level_node_num.write('date,l0,l1,l2,l3,l4\n')
	maxLevel = 5
	for i in range(0, fileLen):
		#初始赋值为文件名称
		lineTextSimilarity = path[i]
		lineTextDistance = path[i]
		for j in range(0, fileLen):
			similarNum = similarity_handler(fileNodeArray[i], fileNodeArray[j])
			lineTextSimilarity = lineTextSimilarity + ',' + str(similarNum)
			distanceNum = distance_handler(fileNodeArray[i], fileNodeArray[j])
			lineTextDistance = lineTextDistance + ',' + str(distanceNum)
		fw_similarity.write(lineTextSimilarity + '\n')
		fw_distance.write(lineTextDistance + '\n')
		#统计每一层的节点数量
		nodeLen = len(fileNodeArray[i])
		countArray = [0,0,0,0,0]
		for k in range(0, nodeLen):
			level = fileNodeArray[i][k].count('|')
			countArray[level] = countArray[level] + 1
		countArrayLen = len(countArray)
		countString = lineTextDistance.replace('XX.csv','')
		for m in range(0, countArrayLen):
			countString = countString + ',' + str(countArray[m])
		fw_level_node_num.write(countString + '\n')
def stat_handler(fileNodeArray, flow_array, file_name_array):
	#获取信号树的流量信息和节点信息
	nodeNum = len(fileNodeArray)
	fileLen = len(file_name_array)
	fw_distance = open('./stat.json', 'w', encoding = 'utf8')
	fw_distance.write('[\n')
	for i in range(0, fileLen):
		if i != (fileLen - 1):
			fileAttr = '{\"sumProportion\":' + str(flow_array[i]) + ',' + '\"file\":\"' + file_name_array[i] + '\"},\n'
		else:
			fileAttr = '{\"sumProportion\":' + str(flow_array[i]) + ',' + '\"file\":\"' + file_name_array[i] + '\"}\n'
		fw_distance.write(fileAttr)
	fw_distance.write(']')
path = os.listdir('./data')
fileLen = len(path)
print(fileLen)
#初始化不同文件的节点数组
fileNodeArray = [[] for i in range(fileLen)]
pattern = re.compile(r'(\d{6,8}-R\d{2}(.)*\d{2}XX).csv')#(\w+)|(-)|(\s)
fileNameArray = [''] * fileLen
flowArray = []
#文件中的所有文件
for i in range(0, fileLen):
	if pattern.match(path[i]):
		fileNameArray[i] = path[i]
		fh = open('./data/' + path[i], 'r', encoding = 'utf-8')
		#把第一行的属性栏提取出来
		line = fh.readline()
		#提取出来用于计算流量大小
		line2 = fh.readline()
		line2 = fh.readline()
		line2ArrayFlowNum = line2.split('\",\"')[2].replace('\"','').strip(' ').replace('\n','')
		flowNum = int(line2ArrayFlowNum.split(',')[0].replace('AAL数量: ', '').replace('字节',''))
		flowArray.append(flowNum)
		#遍历每一行节点，获取重要节点的名称
		fileNodeArray[i].append("root")
		for line in fh:
			lineArray = line.split('\",\"')
			lineNum = len(lineArray)
			for j in range(0, lineNum):
				lineArray[j] = lineArray[j].replace('\"','').strip(' ').replace('\n','')
			isValid = lineArray[1]
			level0 = 'root'
			level1 = lineArray[0]
			level2 = lineArray[3][:4]
			level3and4 = lineArray[4].split(';')
			level3 = level3and4[0]
			if len(level3and4) == 2:		
				level4 = level3and4[1].split(':')[1].replace(' ','')
			else:
				level4 = ''
			#组合重要节点名称到数组中，获取每一个节点的路径，即从根节点到该节点经过的节点名称，中间使用|进行连接
			if isValid == '有效数据':
				levelNameArray = [level1, level2, level3, level4]
				for j in range(0, len(levelNameArray)):
					if levelNameArray[j] != "":
						nodePath = "root"
						for k in range(0, j+1):
							nodePath = nodePath + "|" + levelNameArray[k]
							if nodePath not in fileNodeArray[i]:
								fileNodeArray[i].append(nodePath)
					else:
						break
print(len(fileNodeArray[0]))
#stat_handler(fileNodeArray, flowArray, fileNameArray)
similarity_distance_handler(fileNodeArray)
